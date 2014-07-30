### API:
-   `/new?name=[custom_id_here]&url=[http://example.com]&pass=[Password_to_delete_tiny]` — Returns json for a tinyed ID.
-   `/[id]` — Redirects to tinyed website.
-   Stats coming soon

### Example:
-   `$ curl http://127.0.0.1:8092/new?name=google&url=http://google.com&pass=del`

> {error: 201, message: google Created, protocol: http:, url: google.com, path: /, pass: del, link: http://127.0.0.1:8092/google}

-   `$ curl http://127.0.0.1:8092/new?url=http://google.com` Coming soon <<

> {error: 201, message: sjekl Created, protocol: http:, url: google.com, path: /, pass: del, link: http://127.0.0.1:8092/sjekl}


#More to come