async function checkTokenValidity() {
	try {
		const response = await fetch("/check-token", {
			method: "GET",
			credentials: "include",
		});

		if (!response.ok) {
			console.log("Token is expired, signing out");
			window.location.href = "/signout";
		}
	} catch (error) {
		console.error("Erreur lors de la vérification du token :", error);
		window.location.href = "/signout";
	}
}

setInterval(checkTokenValidity, 10000);

await checkTokenValidity();
