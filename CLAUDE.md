# Homework App — Project Notes

## Deploying to production

Before every push to `main`, bump the version number in `index.html` to bust the browser cache:

```html
<script src="words.js?v=XX"></script>
<script src="emoji-map.js?v=XX"></script>
```

Increment `XX` by 1 each time. After pushing, report the new version number to the user.
