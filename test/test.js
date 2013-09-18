module("Basic");

test("Content Display", function () {
	var app = frames["app"].document;
	ok($("#sideNav li", app).length, "One or more side navigation items");
	ok($("#container p", app).length, "Main container has one or more paragraphs");
});

test("Glossary", function () {
	var app = frames["app"].document;
	ok($(".glossary h3", app).length, "One or more glossary items present");
});