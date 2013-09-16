var apiBase = "http://indirectpayments.neontribe.co.uk/api/",
	options = {
		apiEndpoints: {
			posts: apiBase + "get_posts/",
			pages: apiBase + "get_page_index/"
		},
		historyLimit: 10,
		viewportThreshold: 60,
		scrollTopPadding: 20,
		drawersThreshold: 800,
		debug: true
	},
	lastPosition = [],
	cache = {
		contentViewport: $("#content").outerHeight(true),
		active: null
	};

//
// --- Expressions ---
//

$.extend($.expr[":"], {
	"in-viewport": function (element) {
		var offset = $(element).offset().top;
		return ( offset > options.viewportThreshold && offset < cache.contentViewport - options.viewportThreshold );
	}
});

//
// --- Functions ---
//

// IE safe console log, toggleable through options.debug
window.log = function () {
	log.history = log.history || [];
	log.history.push(arguments);
	if ( console && options.debug ) {
		console.log.apply(console, arguments);
	}
};

// Nano Templates (Tomasz Mazur, Jacek Becela, https://github.com/trix/nano)
function nano(template, data) {
	return template.replace(/\{([\w\.]*)\}/g, function(str, key) {
		var keys = key.split("."), v = data[keys.shift()];
		for (var i = 0, l = keys.length; i < l; i++) v = v[keys[i]];
		return (typeof v !== "undefined" && v !== null) ? v : "";
	});
}

function get_latest_content(type, successCallback) {
	$.ajax({
		url: options.apiEndpoints[type],
		cache: false,
		success: successCallback,
		error: function (xhr, textStatus, thrownError) {
			log("error", xhr, textStatus, thrownError);
		}
	});
}

function glossary(slug) {
	var terms = $("#" + slug).parents("section").find("h3"),
		map = {};

	// order terms by longest first to get 'Mental Capacity Act Code of Practice'
	// replace before 'Mental Capacity'
	terms = _.sortBy(terms, function(el){ return $(el).text().length; }).reverse();

	$.each(terms, function (i, term) {
		var title = $(term).text(),
			definition = $(term).nextUntil("h3").text(),
			regex = new RegExp("(" + title + ")", "gi");
		$("#container section:not(.glossary) p").replaceText(regex, '<abbr title="' + definition + '">$1</abbr>');
	});
}

function display_posts(posts) {
	if ( !posts ) {
		return;
	}

	// reset contents
	$("#container, #sideNav ul").html("");

	// parse if necessary
	if ( !$.isArray(posts) ) {
		posts = JSON.parse(posts);
	}

	// content
	$.each(posts, function (i, post) {
		post.classes = _.pluck(post.tags, "slug").join(" ");
		$("#container").append(nano('<section class="{classes}"><h2 id="{slug}">{title}</h2>{content}</section>', post));
		$("#sideNav ul").append(nano('<li><a href="#{slug}">{title}</a></li>', post));

		// special case for the glossary
		if ( _.findWhere(post.tags, { slug: "glossary" }) ) {
			glossary(post.slug);
		}
	});

	cache.articles = $("#container h2");
}

function display_pages(pages) {
	if ( !pages ) {
		return;
	}

	// reset contents
	$("#auxNav ul").html("");

	// parse if necessary
	if ( !$.isArray(pages) ) {
		pages = JSON.parse(pages);
	}

	// content
	$.each(pages, function (i, page) {
		$("#auxNav ul").append(nano('<li><a href="#{slug}">{title}</a></li>', page));
	});
}

function set_hash(target) {
	if ( !target.match(/^#/) ) {
		target = "#" + target;
	}

	if ( history.pushState ) {
		// modern browsers only
		history.pushState(null, null, target);
	}
}

function save_position() {
	lastPosition.push({
		value: $("#content").scrollTop(),
		article: location.hash
	});

	// be sure the back button is enabled
	$("#back").attr("disabled", false);
}

function scroll_handler() {
	var inView = $("#container h2:in-viewport"),
		id = $(inView[0]).attr("id");
		$first = $("#sideNav a[href='#" + id + "']"),
		$def = $("#definitions"),
		cards = [];

	if ( $first.length ) {
		$("#sideNav a").removeAttr("aria-selected");
		$first.attr("aria-selected", "true");
		set_hash(id);
	}

	// handle glossary terms
	/*$def.html("");
	$("abbr:in-viewport").each(function (i, v) {
		var card = {
			title: $(v).text(),
			definition: $(v).attr("title")
		};
		cards.push(nano("<dt>{title}</dt><dd>{definition}</dd>", card));
	});
	cards = _.uniq(cards);
	$def.html(cards.join(""));*/
}

function init_drawers() {
	if ( $(window).width() <= options.drawersThreshold ) {
		log("Enabling Snap");
		snapper.enable();
	} else {
		log("Disabling Snap");
		snapper.disable();
	}
}

//
// --- Listeners ---
//

// smooth anchor scrolling
$("body").on("click", "a[href*='#']:not([href='#']):not(#menu)", function (evt) {
	if ( location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') || location.hostname == this.hostname) {
		var $target = $(this.hash),
			target = this.hash;
		$target = $target.length ? $target : $('[name=' + this.hash.slice(1) +']');

		if ( $target.length ) {
			evt.preventDefault();
			var offset = $target.offset().top + $("#content").scrollTop() - ( options.viewportThreshold + options.scrollTopPadding ),
				velocity = 1200.0,  // pixels per second
				duration = Math.abs( parseFloat($target.offset().top - ( options.viewportThreshold + options.scrollTopPadding ) ) / velocity );

			// save current position before moving on
			save_position();

			// scroll
			log(this.hash, offset, duration, lastPosition);
			$("#content").animate({ scrollTop: offset }, duration * 1000, function () {
				set_hash(target);
			});
		}
	}
});

// app's back button
$("body").on("click", "#back", function (evt) {
	evt.preventDefault();
	var last = lastPosition.pop();

	$("#content").animate({
		scrollTop: last.value
	}, 1000, function () {
		if ( lastPosition.length === 0) {
			$("#back").attr("disabled", true);
		}
		set_hash(last.article);
	});
});

// menu button
$("body").on("click", "#menu", function (evt) {
	var data = snapper.state();
	if ( data.state === "closed" ) {
		snapper.open("left");
		$('sideNav').focus();
	} else {
		snapper.close();
	}
});

// glossary terms
$("#container").on("click", "abbr", function (evt) {
	$("#definitions dt, #definitions dd").removeClass("fadeIn");
	var cardData = {
			title: $(this).text(),
			definition: $(this).attr("title")
		},
		card = nano("<dt>{title} <span class='close'>&times;</span></dt><dd>{definition}</dd>", cardData);

	$("#definitions").html(card).find("dt, dd").addClass("fadeIn");
	$("#definitions dt").one("click", function (evt) {
		var $card = $(this).next('dd').add(this);
		$card.removeClass("fadeIn").on("webkitTransitionEnd oTransitionEnd transitionend msTransitionEnd", function () {
			$card.remove();
		});
	});
});

// listen to browser window resizes
$(window).resize(function () {
	cache.contentViewport = $("#content").outerHeight(true);
	init_drawers();
});

// listen to scrolling
$("#content").on("scroll", _.throttle( scroll_handler, 100 ));

//
// --- Init ---
//

// set up drawers
var snapper = new Snap({
	element: document.getElementById('content')
});
init_drawers();

// display locally stored content
display_posts(localStorage["posts"]);
display_pages(localStorage["pages"]);

// attempt to get latest content from remote
get_latest_content("posts", function (data) {
	log(data);

	// display it
	display_posts(data.posts);

	// store it
	localStorage["posts"] = JSON.stringify(data.posts);

	// get pages too
	get_latest_content("pages", function (data) {
		log(data);

		// display it
		display_pages(data.pages);

		// store it
		localStorage["pages"] = JSON.stringify(data.pages);
	});

	// if we opened the page with a hash fragment, make sure its target is
	// not hidden under the main navigation
	if ( location.hash ) {
		$("#content").scrollTop($("#content").scrollTop() - options.scrollTopPadding);
	}
});
