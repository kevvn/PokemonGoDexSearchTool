## 2024-05-23 - Custom Toggle Focus Visibility
**Learning:** Custom toggle switches using hidden inputs often fail keyboard accessibility checks because the focus ring is on the invisible element.
**Action:** Use the `peer` class on the hidden input and `peer-focus-visible:ring-*` utilities on the sibling visual element to restore focus visibility.
