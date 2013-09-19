var webHostName = "indirectpayments.neontribe.co.uk",
	apiBase = "http://" + webHostName + "/api/",
	options = {
		apiEndpoints: {
			posts: apiBase + "get_posts/?count=100"
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
	},
	webHosts = [webHostName, "mottokrosh.local"],
	isApp = $.inArray(location.hostname, webHosts) === -1,
	snapperEnabled = false;

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
	if ( console && options.debug && typeof console.log === "function" ) {
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

function get_latest_content(successCallback) {
	$.ajax({
		url: options.apiEndpoints["posts"],
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
			regex = new RegExp("(" + title + ")", "gi"),
			templ = '<span class="term" role="button" tabindex="0" aria-haspopup="true">$1</span><span class="definition a11y-hide a11y-none" aria-hidden="true"> ' + definition + '</span>';
		$("#container section:not(.glossary) p, #container section:not(.glossary) strong").replaceText(regex, templ);
	});
}

function case_studies(slug) {
	var titles = $("#" + slug).parents("section").find("h3");

	$.each(titles, function (i, v) {
		var title = $(v).text(),
			number = i + 1,
			text = all_html($(v).nextUntil("h3")),
			regex = new RegExp('\\[case_study number="' + number + '"\\]', "gi");

		$("#container section:not(.case-studies) p").replaceText(regex, '<details><summary>' + title + '</summary><div>' + text + '</div></details>');
	});
	$("details").unwrap();
}

function all_html(selector_obj) {
	var output = [];
	selector_obj.each(function () {
		output.push($(this).clone().wrap('<p>').parent().html());
	});
	return output.join("");
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

		// case studies
		if ( _.findWhere(post.tags, { slug: "case-studies" }) ) {
			case_studies(post.slug);
		}
	});

	cache.articles = $("#container h2");
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
}

function init_drawers() {
	if ( $(window).width() <= options.drawersThreshold ) {
		log("Enabling Snap");
		snapper.enable();
		snapperEnabled = true;
	} else {
		log("Disabling Snap");
		snapper.disable();
		snapperEnabled = false;
	}
}

function init_content() {
	if ( !localStorage["posts"] ) {
		$.ajax({
			dataType: "json",
			async: false,
			url: "content/posts.json",
			success: function (data) {
				localStorage["posts"] = JSON.stringify(data.posts);
			}
		});
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
				duration = 1;

			// save current position before moving on
			save_position();

			// scroll
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
		$("#sideNav").focus();
	} else {
		snapper.close();
	}
});

// glossary terms
$("#container").on("click", ".term", function (evt) {
	$("#definitions dt, #definitions dd").removeClass("fadeIn");
	var $term = $(this),
		$def = $term.next("span"),
		cardData = {
			title: $term.text(),
			definition: $def.text()
		},
		card = nano("<dt>{title} <span class='close'>&times;</span></dt><dd>{definition}</dd>", cardData);

	// accessibility
	$def.attr({ "aria-hidden": false, "role": "alertdialog" }).removeClass("a11y-none");

	// add card to sidebar
	$("#definitions").html(card).find("dt, dd");
	setTimeout(function () {
		$("#definitions").find("dt, dd").addClass("fadeIn"); // without the timeout, the transition does't work in FF
	}, 100);

	// open sidebar if necessary
	if ( snapperEnabled && snapper.state().state === "closed" ) {
		snapper.open("right");
	}

	// dismissal listener
	$("#definitions dt").one("click", function (evt) {
		var $card = $(this).next('dd').add(this);
		if ( $("html").hasClass("csstransitions") ) {
			$card.removeClass("fadeIn").on("webkitTransitionEnd oTransitionEnd transitionend msTransitionEnd", function () {
				$card.remove();
				$def.attr({ "aria-hidden": true, "role": null }).addClass("a11y-none");
				if ( snapperEnabled && snapper.state().state === "right" ) {
					snapper.close();
				}
			});
		} else {
			$card.removeClass("fadeIn").remove();
			$def.attr({ "aria-hidden": true, "role": null }).addClass("a11y-none");
			if ( snapperEnabled && snapper.state().state === "right" ) {
				snapper.close();
			}
		}
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
	element: document.getElementById('content'),
	touchToDrag: false
});
init_drawers();

// display locally stored content
init_content();
display_posts(localStorage["posts"]);

// attempt to get latest content from remote
get_latest_content(function (data) {
	log(data);

	// display it
	display_posts(data.posts);

	// store it
	localStorage["posts"] = JSON.stringify(data.posts);

	// if we opened the page with a hash fragment, make sure its target is
	// not hidden under the main navigation
	if ( location.hash ) {
		$("#content").scrollTop($("#content").scrollTop() - options.scrollTopPadding);
	}

	// polyfill details
	$("details").details();
});
