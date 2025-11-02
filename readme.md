# Possible setup

Before you start, you may want to try out `npm install three`

# Main view (bookshelf)

I refer to the movies as books because it's easier for my pea brain to work with (since we're doing bookshelf stuff). I included most of the structure for all features. Layout and CSS styling will need fixing, but that's a given. I might work on it later but I'm kinda cooked rn, so we'll leave it be for now.

# Overlay

## Brief program description

NOTE: These are not an Ai generated description or anything so there may be some parts missing / not 100% accurate since I got AI to help out with some of the math/animation elements, but this is my current understanding:

### General

Programatically, once you click on a book, an overlay is displayed. This overlay is triggered via javascript, and the scene that follows (rendering buttons, text, book) is also done via javascript. Basically everything important is in `index.js`.

### Navigation / Metadata

As you might see, each "book" has a json object specifying title, author/director, etc... These json attributes are then rendered in specific HTML elements based on id. As a hyothetical example, the javascript will find the HTML element with id=title and replace the text with the title from the current book's json object.

One such attribute is `tropes`. This attribute is a list of tropes the book falls under. For each trope, a button HTML element is generated, and the trope string is used as a URL parameter that is passed and then read. All the urls lead to `infoPage.html`, where the visualizations will be (and where I suppose you'll be working Audrey).
