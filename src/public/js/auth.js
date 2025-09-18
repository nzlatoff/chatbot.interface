async function checkTokenValidity() {
	try {
		const response = await fetch("/check-token", {
			method: "GET",
			credentials: "include",
		});

		if (!response.ok) {
			window.location.href = "/authko";
		}
	} catch (error) {
		console.error("Erreur lors de la vérification du token :", error);
		window.location.href = "/authko";
	}
}

setInterval(checkTokenValidity, 10000);

await checkTokenValidity();
