var options = {
	apiURL: "http://mottokrosh.local/IndirectPayments/wordpress/api/",
	debug: true
};

window.log = function () {
	log.history = log.history || [];
	log.history.push(arguments);
	if ( console && options.debug ) {
		console.log.apply(console, arguments);
	}
};

function get_latest_content(successCallback) {
	$.ajax({
		url: options.apiURL + "get_posts/",
		cache: false,
		success: successCallback,
		error: function (xhr, textStatus, thrownError) {
			log("error", xhr, textStatus, thrownError);
		}
	});
}

function display_content(posts) {
	// reset contents
	$("#content, #sideNav ul").html("");

	// parse if necessary
	if ( !$.isArray(posts) ) {
		posts = JSON.parse(posts);
	}

	// content
	$.each(posts, function (i, post) {
		$("#content").append("<h2>" + post.title + "</h2>\n" + post.content);
		$("#sideNav ul").append('<li><a href="#' + post.slug + '">' + post.title + '</a></li>');
	});
}

// set up drawers
var snapper = new Snap({
	element: document.getElementById('content')
});

// display locally stored content
display_content(localStorage["posts"]);

// attempt to get latest content from remote
get_latest_content(function (data) {
	log(data);

	// display it
	display_content(data.posts);

	// store it
	localStorage["posts"] = JSON.stringify(data.posts);
});
