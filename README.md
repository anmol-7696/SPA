# ConnectHub

A multi-threaded web server that hosts a Single Page Application (SPA) message board. The frontend communicates with the backend entirely through AJAX (XMLHttpRequest), allowing users to register, log in, and post messages without page refreshes.

## Features

Multi-threaded web server

Single Page Application (no reloads)

User registration and authentication

Session handling with HTTP-only cookies

Dynamic message board with polling

REST-style API under /api/

Static file serving (HTML, JS, images)

Graceful error handling

## Tech Stack

Backend: Custom multi-threaded web server

Frontend: HTML, CSS, JavaScript

Communication: XMLHttpRequest (AJAX)

Sessions: Cookies (HttpOnly, withCredentials)

## How It Works

/ serves the main SPA (index.html)

All data interactions happen via JavaScript

No form submissions or page reloads

Server maintains user, session, and message state

Clients poll the server for new messages
