import socket
import threading
import select
from urllib.parse import unquote_plus
import os
import subprocess

# In-memory demo storage (not persistent)
users = {}      # username -> password (plain text for demo only)
messages = []   # list of (username, text)

bad_header = "HTTP/1.1 400 Bad Request"
not_found_header = "HTTP/1.1 404 Not Found"
ok_header =  """HTTP/1.1 200 OK
Content-Length: {}

"""

HOST = ''
PORT = 8000

def parse_request(req, sock:socket.socket):
	lines = req.split("\n")
	tokens = lines[0].split(" ")
	method = tokens[0]

	#strips leading '/' and trailing '?'
	try:
		resource = tokens[1].split("/")[1].split("?")[0]
	except Exception:
		sock.sendall(bad_header.encode())
		return

	if method != "GET" and method != "POST":
		sock.sendall(bad_header.encode())
		return

	# parse POST body (simple urlencoded form parser)
	body_params = {}
	raw_body = ""
	if method == "POST":
		i = 1
		# find blank line separating headers and body
		while i < len(lines) and len(lines[i].strip()) > 0:
			i += 1
		i += 1

		if i <= len(lines):
			raw_body = "\n".join(lines[i:]).strip()
			try:
				for pair in raw_body.split('&'):
					if '=' in pair:
						k, v = pair.split('=', 1)
						body_params[k] = unquote_plus(v)
			except Exception:
				sock.sendall(bad_header.encode())
				return



	# API endpoints
	if method == 'POST' and resource == 'register':
		username = body_params.get('username', '').strip()
		password = body_params.get('password', '')
		if not username or not password:
			sock.sendall(bad_header.encode())
			return
		if username in users:
			resp = 'EXISTS'
		else:
			users[username] = password
			resp = 'OK'
		sock.sendall((ok_header.format(len(resp)) + resp).encode())
		return

	if method == 'POST' and resource == 'login':
		username = body_params.get('username', '').strip()
		password = body_params.get('password', '')
		if username in users and users[username] == password:
			resp = 'OK'
		else:
			resp = 'FAIL'
		sock.sendall((ok_header.format(len(resp)) + resp).encode())
		return

	if method == 'POST' and resource == 'post':
		username = body_params.get('username', 'anon')
		text = body_params.get('text', '').strip()
		if not text:
			sock.sendall(bad_header.encode())
			return
		messages.append((username, text))
		resp = 'OK'
		sock.sendall((ok_header.format(len(resp)) + resp).encode())
		return

	if method == 'GET' and resource == 'messages':
		# return messages as simple newline-separated lines: username|text
		body = ''
		for u, t in messages:
			safe = t.replace('\n', ' ')
			body += f"{u}|{safe}\n"
		sock.sendall((ok_header.format(len(body)) + body).encode())
		return

	body = ""
	if resource == "":
		try:
			file = open("static_files/index.html", "r")
			body = file.read()
			file.close()
		except:
			sock.sendall(not_found_header.encode())
			return
	elif resource.endswith('.html') or resource.endswith('.js') or resource.endswith('.css'):
		try:
			file = open(f"static_files/{resource}", "r")
			body = file.read()
			file.close()
		except:
			sock.sendall(not_found_header.encode())
			return
	else:
		sock.sendall(not_found_header.encode())
		return

	sock.sendall((ok_header.format(len(body)) + body).encode())

def handle_client(conn, addr):
    print(f"New connection from {addr}")
    try:
        request = conn.recv(1024).decode()
        if request:
            parse_request(request, conn)
    except Exception as e:
        print(f"Error occured: {e}")
    finally:
        conn.close()

def start_server():
	server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
	server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
	server.bind((HOST, PORT))
	server.listen(5)

	print(f"Server started on port {PORT}")

	try:
		while True:
			client_conn, client_addr = server.accept()
			# Create a new thread for each client
			client_thread = threading.Thread(
				target=handle_client,
				args=(client_conn, client_addr)
			)
			client_thread.daemon = True
			client_thread.start()
	except KeyboardInterrupt:
		print("\nShutting down server...")
	finally:
		server.close()


if __name__ == "__main__":
	start_server()
