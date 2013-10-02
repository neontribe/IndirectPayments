module("Main");

test("Content Display", function () {
	var app = frames["app"].document;
	ok($("#sideNav li", app).length, "One or more side navigation items");
	ok($("#container p", app).length, "Main container has one or more paragraphs");
});

test("Glossary", function () {
	var app = frames["app"].document,
		termsCount = $(".glossary h3", app).length,
		termsWrappedCount = $(".term", app).length;

	ok(termsCount, "One or more glossary items present");
	ok(termsWrappedCount >= termsCount, "Glossary terms marked up in content");
	ok($(".definition", app).length === termsWrappedCount, "Each marked up term has a definition");
	ok($("#definitions dt", app).length === 0, "Definitions list is initially empty");

	$(".term:first", app).trigger("click");

	ok($("#definitions dt", app).length === 1, "After clicking term, definitions list contains card");

	$("html", app).removeClass("csstransitions");
	$("#definitions dt", app).trigger("click");

	ok($("#definitions dt", app).length === 0, "Clicking definition title removes card from definitions list");
});

test("Case Studies", function () {
	var app = frames["app"].document,
		$detail = $("details:first", app);

	ok($(".case-studies h3", app).length, "One or more case studies present");
	ok($("details", app).length, "One or more case studies turned into inline details blocks");
	ok(!$detail.find("> div").is(":visible"), "First details' content initially hidden");

	$detail.find("summary").trigger("click");

	ok($detail.find("> div").is(":visible"), "Clicking summary reveals details content");
});

test("Checklist", function () {
	var app = frames["app"].document;
	ok($("section .checklist button", app).length, "There are checklist buttons present");
	ok($("section .checklist button", app).parent().next("div").is(":not(:visible)"), "The checklist content is initially hidden");
	$("section .checklist button", app).eq(0).trigger("click");
	ok($("section .checklist button", app).eq(0).parent().next("div").is(":visible"), "Content shown when button clicked");
});