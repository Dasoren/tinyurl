# TinyURL by Dasoren
##  Powered by Node.js, Express.js, and Reddis

### Install:
-   `$ git clone git://github.com/dasoren/tinyurl.git`
-   `$ cd tinyurl/`
-   `$ npm install`
-   Make sure you have [Node.js](http://nodejs.org/), and [Redis](http://redis.io/download) installed.
-   Run the `$ redis-server` command in a terminal window
-   edit `$ nano server.js` and edit the var's `host_url` and `default_link` for your system.
-   Finally, run the application via `$ node server.js` in another terminal window
-   Visit `http://127.0.0.1:8092` to view the running application (no web app at this time)

---
### API v1:
-   `/v1/new?name=[custom_id_here]&url=[http://example.com]&pass=[Password_to_delete_tiny]` — Returns json for a tinyed ID.
-   `/v1/[id]` — Redirects to tinyed website.
-   `/v1/stats/[id]` - Returns the id stats and values.

### Example of old API:
-   `$ curl http://127.0.0.1:8092/new?name=google&url=http://google.com&pass=del`

> {error: 201, message: google Created, protocol: http:, url: google.com, path: /, pass: del, link: http://127.0.0.1:8092/google}

-   `$ curl http://127.0.0.1:8092/new?url=http://google.com` Coming soon <<

> {error: 201, message: sjekl Created, protocol: http:, url: google.com, path: /, pass: del, link: http://127.0.0.1:8092/sjekl}

---

### To Do:

- Add random url
- Add web interface
- Add stats viewer
- API Documentation

### Change Log:

- 7/31/2014 Started adding in API v1
- 7/30/2014 First post and upload

### Notes:
There is still a lot of work going into this, so more updates to come.

