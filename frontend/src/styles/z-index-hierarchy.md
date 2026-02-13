# Z-Index Hierarchy

This document defines the z-index stacking order for the application to prevent overlap issues.

## Hierarchy (lowest to highest)

- **Base content**: z-0 (default)
- **Navbar/Header**: z-30
- **Dropdowns/Popovers**: z-40
- **Modals/Dialogs**: z-50
- **Toasts/Notifications**: z-60 (handled by react-hot-toast)

## Usage Guidelines

1. **Dropdowns** (notifications, quick actions, select menus):
   - Use `z-40`
   - Position: `absolute` with `top-full` for proper alignment
   - Parent must have `relative` positioning

2. **Modals** (dialogs, forms):
   - Use `z-50`
   - Position: `fixed` with `inset-0` for overlay
   - Include backdrop with `bg-black/40`

3. **Navigation** (sidebar, top navbar):
   - Use `z-30`
   - Ensures dropdowns appear above navigation

## Best Practices

- Always use `relative` on parent containers for dropdowns
- Use `absolute` positioning with `top-full` for dropdown alignment
- Add `stopPropagation()` on modal content to prevent backdrop clicks
- Implement outside-click detection for all dropdowns
- Add escape key support for dismissible UI elements
