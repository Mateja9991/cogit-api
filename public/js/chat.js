const socket = io.connect('http://localhost:3000');
console.log(socket);
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

var fetchedToken;

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
const $messageBoard = document.querySelector('#messages');

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
		fetchedToken = token;
		socket.emit('authenticate', { token }, () => {
			const $button = document.querySelector('.msg-button');
			const $input = document.querySelector('.msg-input');
			const $user = document.querySelector('.user-input');

			$button.addEventListener('click', () => {
				const receiverEmail = $user.value;
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
			});
		});
	})
	.catch((e) => {
		console.log(e);
	});
