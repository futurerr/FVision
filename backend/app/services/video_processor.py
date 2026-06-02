from ultralytics import YOLO
from app.services.ai_service import ai_service
import numpy as np
from scipy.ndimage import gaussian_filter
from sklearn.cluster import KMeans
import cv2
import json
import os
import asyncio
import torch

class VideoProcessor:
    def __init__(self, model_path="yolov8n.pt"):
        self.model_path = model_path
        self._model = None
        self.device = self._get_device()
        print(f"[VideoProcessor] Using device: {self.device}")
    
    @property
    def model(self):
        if self._model is None:
            print(f"[VideoProcessor] Loading YOLO model on {self.device}...")
            self._model = YOLO(self.model_path)
        return self._model

    def _get_device(self):
        """Force CPU to avoid hangs during torch.cuda initialization on AMD Windows systems"""
        print("[VideoProcessor] Forcing CPU mode for stability")
        return 'cpu'
    
    def _extract_dominant_color(self, frame, bbox):
        """Extract dominant color from player bounding box"""
        try:
            x1, y1, x2, y2 = map(int, bbox)
            player_region = frame[y1:y2, x1:x2]
            
            if player_region.size == 0:
                return None
            
            hsv = cv2.cvtColor(player_region, cv2.COLOR_BGR2HSV)
            h, w = hsv.shape[:2]
            torso = hsv[int(h*0.3):int(h*0.7), int(w*0.2):int(w*0.8)]
            
            if torso.size == 0:
                return None
            
            mean_color = cv2.mean(torso)[:3]  # H, S, V
            return mean_color
        except Exception as e:
            print(f"[Color Extract Error]: {e}")
            return None

    async def process_video(self, video_path: str, output_json_path: str):
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        cap.release()

        imgsz = 480 # Optimized for CPU
        
        print(f"[VideoProcessor] Processing with device={self.device}, imgsz={imgsz}")
        
        results = self.model.track(
            source=video_path,
            stream=True,
            device=self.device,
            imgsz=imgsz,
            persist=True,
            tracker="bytetrack.yaml",
            classes=[0],  # Only 'person'
            verbose=False
        )

        frames_data = []
        frame_idx = 0
        all_colors = []
        
        for result in results:
            frame_data = {"frame": frame_idx, "detections": []}
            if result.boxes is not None and len(result.boxes) > 0:
                frame_bgr = result.orig_img
                for box in result.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    track_id = int(box.id.item()) if box.id is not None else None
                    cls = int(box.cls.item())
                    label = result.names[cls]
                    
                    if label == 'person':
                        color = self._extract_dominant_color(frame_bgr, [x1, y1, x2, y2])
                        detection = {
                            "id": track_id,
                            "label": label,
                            "bbox": [x1, y1, x2, y2],
                            "center": [(x1+x2)/2, (y1+y2)/2],
                            "color": color if color else [0, 0, 0],
                            "team_id": None
                        }
                        frame_data["detections"].append(detection)
                        if color:
                            all_colors.append(color)
            
            frames_data.append(frame_data)
            frame_idx += 1
            if frame_idx % 10 == 0:
                await asyncio.sleep(0)
        
        if len(all_colors) > 10:
            try:
                kmeans = KMeans(n_clusters=2, random_state=42, n_init=10)
                color_array = np.array(all_colors)
                kmeans.fit(color_array)
                for frame_data in frames_data:
                    for det in frame_data["detections"]:
                        if det["color"] and det["color"] != [0, 0, 0]:
                            color_array = np.array([det["color"]])
                            team_id = int(kmeans.predict(color_array)[0])
                            det["team_id"] = team_id
            except Exception as e:
                print(f"[Team Clustering Error]: {e}")

        output_data = {
            "metadata": {
                "fps": fps if fps > 0 else 25.0,
                "width": width,
                "height": height,
                "total_frames": total_frames
            },
            "frames": frames_data
        }

        with open(output_json_path, 'w') as f:
            json.dump(output_data, f)
            
        return output_data

    async def generate_tactical_summary(self, json_path: str):
        if not os.path.exists(json_path):
            return "未找到追踪数据。"
            
        with open(json_path, 'r') as f:
            data = json.load(f)
            
        frames = data.get("frames", [])
        if not frames:
            return "无帧数据。"
            
        total_detections = 0
        centers_x = []
        centers_y = []
        
        for frame in frames:
            dets = frame.get("detections", [])
            total_detections += len(dets)
            for det in dets:
                cx, cy = det.get("center", [0, 0])
                centers_x.append(cx)
                centers_y.append(cy)
                
        avg_players = total_detections / len(frames) if frames else 0
        
        speeds = []
        for i in range(len(frames) - 1):
            frame1 = frames[i]
            frame2 = frames[i + 1]
            for det1 in frame1.get("detections", []):
                if det1.get("id") is None:
                    continue
                for det2 in frame2.get("detections", []):
                    if det2.get("id") == det1.get("id"):
                        cx1, cy1 = det1.get("center", [0, 0])
                        cx2, cy2 = det2.get("center", [0, 0])
                        distance = np.sqrt((cx2 - cx1)**2 + (cy2 - cy1)**2)
                        speeds.append(distance)
                        break
        
        avg_speed = np.mean(speeds) if speeds else 0
        max_speed = np.max(speeds) if speeds else 0
        
        width = data.get("metadata", {}).get("width", 1920)
        midfield_x = width / 2
        
        left_side_count = sum(1 for x in centers_x if x < midfield_x)
        right_side_count = sum(1 for x in centers_x if x >= midfield_x)
        total_pos = left_side_count + right_side_count
        left_pct = (left_side_count / total_pos * 100) if total_pos > 0 else 0
        right_pct = (right_side_count / total_pos * 100) if total_pos > 0 else 0
        
        spread_x = np.std(centers_x) if centers_x else 0
        spread_y = np.std(centers_y) if centers_y else 0
        
        # Extract peak activity nodes
        events = self.extract_events(json_path)
        events_summary = ""
        if events:
            events_summary = "关键时间节点活动：\n"
            for ev in events[:5]: # Top 5 events
                events_summary += f"- {ev['time']:.1f}s: {ev['description']}\n"

        stats_summary = (
            f"比赛时长: {len(frames)} 帧。"
            f"平均可见球员数: {avg_players:.1f}。"
            f"球员分布: 左侧 {left_pct:.1f}%，右侧 {right_pct:.1f}%。"
            f"横向分散度: {spread_x:.1f}。"
            f"纵向分散度: {spread_y:.1f}。"
            f"平均移动速度: {avg_speed:.1f} 像素/帧，最大速度: {max_speed:.1f}。\n"
            f"{events_summary}"
        )
        
        prompt = (
            f"你是一名资深足球战术分析师。请基于以下全场追踪统计数据和关键时间节点，提供一份全盘技战术总结：\n\n"
            f"{stats_summary}\n\n"
            f"要求：\n"
            f"1. 分析整体攻防阵型（紧凑度、覆盖范围）。\n"
            f"2. 归纳进攻重心（左/右路偏好）。\n"
            f"3. 针对关键时间节点的活动给出点评。\n"
            f"4. 语言专业、客观、简洁（约150字以内）。\n"
            f"5. 使用中文回答。"
        )
        
        ai_response = await ai_service.analyze_text(prompt)
        return ai_response

    def generate_heatmap_data(self, json_path: str, grid_size: int = 600):
        if not os.path.exists(json_path):
            return None
        with open(json_path, 'r') as f:
            data = json.load(f)
        frames = data.get("frames", [])
        if not frames:
            return None
        width = data.get("metadata", {}).get("width", 1920)
        height = data.get("metadata", {}).get("height", 1080)
        
        # High-resolution grid
        heatmap = np.zeros((grid_size, grid_size))
        for frame in frames:
            for det in frame.get("detections", []):
                cx, cy = det.get("center", [0, 0])
                grid_x = int((cx / width) * (grid_size - 1))
                grid_y = int((cy / height) * (grid_size - 1))
                grid_x = max(0, min(grid_size - 1, grid_x))
                grid_y = max(0, min(grid_size - 1, grid_y))
                heatmap[grid_y, grid_x] += 1
        
        # Optimized blurring for high-res smoothness
        heatmap = gaussian_filter(heatmap, sigma=15)
        if heatmap.max() > 0:
            heatmap = heatmap / heatmap.max()
        return {
            "grid_size": grid_size,
            "data": heatmap.tolist(),
            "width": width,
            "height": height
        }

    def extract_events(self, json_path: str):
        if not os.path.exists(json_path):
            return []
        with open(json_path, 'r') as f:
            data = json.load(f)
        frames = data.get("frames", [])
        if not frames:
            return []
        fps = data.get("metadata", {}).get("fps", 25)
        
        events = []
        player_counts = [len(frame.get("detections", [])) for frame in frames]
        if not player_counts: return []
        
        avg_count = np.mean(player_counts)
        std_count = np.std(player_counts)
        
        # Identify moments of high activity (densely packed players)
        for i, frame in enumerate(frames):
            count = len(frame.get("detections", []))
            time_seconds = i / fps
            
            # Simple peak detection
            if count > avg_count + 1.5 * std_count:
                events.append({
                    "time": time_seconds,
                    "type": "high_activity",
                    "description": f"球员高密度聚集 (检测到 {count} 人)"
                })
        
        # Filter sequences - only keep the peak of each 2s window
        filtered_events = []
        if events:
            last_time = -999
            for ev in events:
                if ev['time'] - last_time > 2.0:
                    filtered_events.append(ev)
                    last_time = ev['time']
        
        return filtered_events

video_processor = VideoProcessor()
