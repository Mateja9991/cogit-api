const queryParamsString = window.location.search.substr(1);
const queryParams = queryParamsString
	.split('&')
	.reduce((accumulator, singleQueryParam) => {
		const [key, value] = singleQueryParam.split('=');
		accumulator[key] = value;
		return accumulator;
	}, {});
console.log(queryParams.email);
console.log(queryParams.password);

fetch('http://localhost:3000/users/login', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
	},
	body: JSON.stringify({
		email: queryParams.email,
		password: queryParams.password,
	}),
})
	.then((response) => {
		return response.json();
	})
	.then(({ token }) => {
		console.log(token);
		const socket = io('/users', {
			query: {
				token,
			},
		});
		var fetchedToken = token;
		console.log(socket);
		socket.on('connect_error', (err) => {
			console.log(err.message); // prints the message associated with the error
		});

		socket.on('new-message', ({ username, message }) => {
			console.log(username, message);
			$messageBoard.innerHTML += `<p>${username}:${message}</p>`;
		});
		socket.on('message-history', (history) => {
			$messageBoard.innerHTML = '';
			history.forEach((msg) => {
				$messageBoard.innerHTML += `<p>${msg}</p>`;
			});
		});
		socket.on('error', (error) => {
			console.log(error);
		});
		socket.on('new-notification', (notif) => {
			console.log(notif);
		});
		const $messageBoard = document.querySelector('#messages');

		const $button = document.querySelector('.msg-button');
		const $input = document.querySelector('.msg-input');
		const $user = document.querySelector('.user-input');
		const $team = document.querySelector('.team-input');
		const $teamMessage = document.querySelector('.team-msg-input');

		$button.addEventListener('click', () => {
			const receiverEmail = $user.value;
			const teamId = $team.value;
			if (receiverEmail) {
				fetch(`http://localhost:3000/users/email/${receiverEmail}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${fetchedToken}`,
					},
				})
					.then((response) => {
						return response.json();
					})
					.then((receiver) => {
						console.log(receiver.user._id);
						fetch(
							`http://localhost:3000/users/${receiver.user._id}/me/messages`,
							{
								method: 'GET',
								headers: {
									'Content-Type': 'application/json',
									Authorization: `Bearer ${fetchedToken}`,
								},
							}
						)
							.then((response) => {
								return response.json();
							})
							.then((data) => {
								$messageBoard.innerHTML = '';
								data.forEach(({ text, from }) => {
									$messageBoard.innerHTML += `<p>${from}:${text}</p>`;
								});
							});
					});

				socket.emit('newMessageToUser', receiverEmail, $input.value, (id) => {
					console.log(id);
				});
			} else {
				console.log('pre-if(teamId)');
				if (teamId) {
					console.log('pre-emit');
					socket.emit('newMessageToTeam', teamId, $teamMessage.value, (res) => {
						console.log(res);
					});
				}
			}
		});
	})
	.catch((e) => {
		console.log(e);
	});
