# Deprecated Effects

These components are deprecated and kept only for backward compatibility or admin preview purposes.

## NeuralCircuitBackground

**Deprecated**: December 2025
**Reason**: Over-engineered (1,326 LOC physics simulation for decorative background)
**Alternative**: Use `NeuralNetworkSVG` for biological neural network effects

The NeuralCircuitBackground is kept for:
- Admin preview page at `/nucleus/admin/visuals`
- Potential future use cases requiring physics-based animations

Do not use in new features. If you need neural network effects, use `NeuralNetworkSVG` instead.
