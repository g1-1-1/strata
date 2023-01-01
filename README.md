# strata

strata is a pastebin clone that never sees the contents of its pastes.

it takes advantage of some unique properties of the hash portion of a URL to
avoid ever being able to see the content the pastes it helps create.

what is the "hash" of a URL, and why is it special? 
the hash is the portion of the URL that follows the `#` symbol. 
for example:

```python
http://example.com#the-hash
```

here's what makes it special:

> when an user agent requests a web resource from a web
> server, the agent sends the URI to the server, but does not send the
> [hash].

-- [wikipedia](http://en.wikipedia.org/wiki/Fragment_identifier)

at first glance that may not seem terribly note-worthy, but it allows for
something very interesting. it allows you to store information in a URL that
the server never sees, but can be read by javascript.

you can think about it like this, a URL contains two distinct pieces of
information:

1. a pointer to a location where it can download a web app
2. a piece of data which you want that app to interpret

this is exactly what i have built. when your browser requests, for example
`http://strata.halcyon.moe`, it retrieves a simple javascript web app that immediately 
takes the content of the hash, uncompresses it, and displays it as text on the page.

since my server never sees, much less *provides*, the content being displayed
on the page, i say that i should be immune to takedown notices. even if
i did receive one, what action could i take? i suppose i could stop hosting the
app, but that hardly seems reasonable; and besides, it's open source! if
another individual wanted to host it, then they can go ahead!

say a website offered you a `.doc` file as well as a link to download microsoft
word so that you could view that file. if that file was found to contain,
illegal or copyrighted material, we wouldn't say that microsoft should stop
hosting microsoft word would we?

## credit

this site was inspired by two other very similar sites:

- http://iamnotagoodartist.com/web/an-auto-updating-data-uri-text-editor/
- [hashify.me](http://bit.ly/dXYxGU)
- [hastebin](http://hastebin.com/) | i pretty much stole their site aesthetic..
