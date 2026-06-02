# Contributing to FVision

We love your input! Here's how you can help.

## Getting Started

1. Fork the repo and create your branch from `main`
2. Install dependencies (see [README](README.md#getting-started))
3. Make your changes
4. Test thoroughly

## Development Guidelines

### Backend
- Follow PEP 8 conventions
- Type hints are strongly encouraged
- Async endpoints for IO-bound operations
- Keep YOLO processing on CPU by default (compatible with Windows AMD)

### Frontend
- Use functional components with hooks
- Maintain the HUD/cyberpunk design language
- CSS custom properties for theme consistency
- Handle loading, empty, and error states for all components

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update any relevant API documentation
3. The PR will be merged once reviewed

## Feature Ideas

- [ ] Export tactical reports as PDF
- [ ] Support for multiple camera angles
- [ ] Real-time (live match) analysis
- [ ] Formation recognition (4-4-2, 4-3-3, etc.)
- [ ] Ball detection and tracking
- [ ] Player re-identification across camera cuts
- [ ] WebSocket-based progress streaming
- [ ] Batch video processing
- [ ] English-language AI output option
- [ ] Docker deployment support
