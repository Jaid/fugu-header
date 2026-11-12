The web app manifest has to request the overlay. Browsers only grant it to installed apps.

```json
{
  "display": "standalone",
  "display_override": ["window-controls-overlay"]
}
```
