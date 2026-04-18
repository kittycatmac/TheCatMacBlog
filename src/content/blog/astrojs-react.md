---
title: 'Build a Blog with Astro Js and React'
description: 'Steps for creating a blog with Astro Js and React.'
pubDate: 'March 28 2026'
heroImage: '/Build_the_web_you_want.png'
---

If you are new to coding this project and learing markdown can lend to front end code is a great way to get started on the learning path. Markdown has similarities to HTML and is used heavily in documentation and other post creation platforms.

Here is a sample of some basic Markdown syntax that can be used when writing Markdown content in Astro.

## Headings

The following HTML `<h1>`—`<h6>` elements represent six levels of section headings. `<h1>` is the highest section level while `<h6>` is the lowest.

# H1

## H2

### H3

#### H4

##### H5

###### H6

## Paragraph

Xerum, quo qui aut unt expliquam qui dolut labo. Aque venitatiusda cum, voluptionse latur sitiae dolessi aut parist aut dollo enim qui voluptate ma dolestendit peritin re plis aut quas inctum laceat est volestemque commosa as cus endigna tectur, offic to cor sequas etum rerum idem sintibus eiur? Quianimin porecus evelectur, cum que nis nust voloribus ratem aut omnimi, sitatur? Quiatem. Nam, omnis sum am facea corem alique molestrunt et eos evelece arcillit ut aut eos eos nus, sin conecerem erum fuga. Ri oditatquam, ad quibus unda veliamenimin cusam et facea ipsamus es exerum sitate dolores editium rerore eost, temped molorro ratiae volorro te reribus dolorer sperchicium faceata tiustia prat.

Itatur? Quiatae cullecum rem ent aut odis in re eossequodi nonsequ idebis ne sapicia is sinveli squiatum, core et que aut hariosam ex eat.

## Images

### Syntax

```markdown
![Alt text](./full/or/relative/path/of/image)
```

### Output

![blog placeholder](/blog-placeholder-about.jpg)

## Blockquotes

The blockquote element represents content that is quoted from another source, optionally with a citation which must be within a `footer` or `cite` element, and optionally with in-line changes such as annotations and abbreviations.

### Blockquote without attribution

#### Syntax

```markdown
> Tiam, ad mint andaepu dandae nostion secatur sequo quae.  
> **Note** that you can use _Markdown syntax_ within a blockquote.
```

#### Output

> Tiam, ad mint andaepu dandae nostion secatur sequo quae.  
> **Note** that you can use _Markdown syntax_ within a blockquote.

### Blockquote with attribution

#### Syntax

```markdown
> Don't communicate by sharing memory, share memory by communicating.<br>
> — <cite>Rob Pike[^1]</cite>
```

#### Output

> Don't communicate by sharing memory, share memory by communicating.<br>
> — <cite>Rob Pike[^1]</cite>

[^1]: The above quote is excerpted from Rob Pike's [talk](https://www.youtube.com/watch?v=PAAkCSZUG1c) during Gopherfest, November 18, 2015.

## Tables

### Syntax

```markdown
| Italics   | Bold     | Code   |
| --------- | -------- | ------ |
| _italics_ | **bold** | `code` |
```

### Output

| Italics   | Bold     | Code   |
| --------- | -------- | ------ |
| _italics_ | **bold** | `code` |

## Code Blocks

### Syntax

we can use 3 backticks ``` in new line and write snippet and close with 3 backticks on new line and to highlight language specific syntax, write one word of language name after first 3 backticks, for eg. html, javascript, css, markdown, typescript, txt, bash

````markdown
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Example HTML5 Document</title>
  </head>
  <body>
    <p>Test</p>
  </body>
</html>
```
````

### Output

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Example HTML5 Document</title>
  </head>
  <body>
    <p>Test</p>
  </body>
</html>
```

## List Types

### Ordered List

#### Syntax

```markdown
1. First item
2. Second item
3. Third item
```

#### Output

1. First item
2. Second item
3. Third item

### Unordered List

#### Syntax

```markdown
- List item
- Another item
- And another item
```

#### Output

- List item
- Another item
- And another item

### Nested list

#### Syntax

```markdown
- Fruit
  - Apple
  - Orange
  - Banana
- Dairy
  - Milk
  - Cheese
```

#### Output

- Fruit
  - Apple
  - Orange
  - Banana
- Dairy
  - Milk
  - Cheese

## Other Elements — abbr, sub, sup, kbd, mark

### Syntax

```markdown
<abbr title="Graphics Interchange Format">GIF</abbr> is a bitmap image format.

H<sub>2</sub>O

X<sup>n</sup> + Y<sup>n</sup> = Z<sup>n</sup>

Press <kbd>CTRL</kbd> + <kbd>ALT</kbd> + <kbd>Delete</kbd> to end the session.

Most <mark>salamanders</mark> are nocturnal, and hunt for insects, worms, and other small creatures.
```

### Output

<abbr title="Graphics Interchange Format">GIF</abbr> is a bitmap image format.

H<sub>2</sub>O

X<sup>n</sup> + Y<sup>n</sup> = Z<sup>n</sup>

Press <kbd>CTRL</kbd> + <kbd>ALT</kbd> + <kbd>Delete</kbd> to end the session.

Most <mark>salamanders</mark> are nocturnal, and hunt for insects, worms, and other small creatures.

## Adding React to AstroJS

First get node and npm I like to use nvm to change my different versions of node for running apps. You will need these javascript packages to run your javascript files locally on your computer. You will be using VS code with the AstroJS extension and a CLI like terminal or command line to spin up your app. 

In your terminal or command line create a folder and in that folder create your project.

```bash
npm create astro@latest
```

If you run into any issues, use nvm to check the npm, node versions compatibility with AstroJs.

### 1. Automatically Add REACT

```bash
npx astro add react
```

This will automatically add dependencies and update your astro.config.mjs Done!

### 2. Manually Add REACT

Install dependencies

```bash
npm install @astrojs/react react react-dom
```

Update astro.config.mjs

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
});
```


### Usage

Once added, you can use .jsx / .tsx files directly. Use React only where you need interactivity.

```jsx
// src/components/MyComponent.jsx
export default function MyComponent() {
  return <h1>Hello from React!</h1>;
}
```
```astro
---
// src/pages/index.astro
import MyComponent from '../components/MyComponent.jsx';
---
<MyComponent />
```

### Client Side Interactivity

By default, Astro renders components as static HTML. To make React components interactive, add a client:* directive:

```astro
<MyComponent client:load />     <!-- hydrate on page load -->
<MyComponent client:idle />     <!-- hydrate when browser is idle -->
<MyComponent client:visible />  <!-- hydrate when visible in viewport -->
```

```client:load```

Hydrate immediately when the page loads
Blocks nothing, but the JS is downloaded and executed right away
Use for components the user will interact with instantly (nav dropdowns, modals, search bars)

```client:idle```

Hydrates when the browser has finished its main work (requestIdleCallback)
Good for components that aren’t immediately needed but are still above the fold

```client:visible```

Hydrates only when the component scrolls into the viewport (uses IntersectionObserver)
The JS isn’t even downloaded until the user scrolls near it
Best for components below the folder (carousels, comment sections, footer widgets)

```client:only```

Skips server-side rendering entirely and renders only in the browser
Use for components that depend on browser APIs (window, localStorage, etc)

Quick decision guide
Directive
When JS loads
Use for
client:load
Immediately
Nav, modals, search
client:idle
Browser idle
Secondary UI above fold
client:visible
On scroll into view
Anything below the fold
client:only
Browser only
Maps, charts, browser-API components


Without these directives, you’d ship all the JS upfront even for components the user may never scroll to. With the directives, the JS is deferred until it’s actually needed, improving your sites Time to Interactive (TTI) and Lighthouse scores.

### Islands Architecture

Since the astro components are default, then each interactive component is an isolated “island” of JS.

#### Project Structure

```
src/
  components/
    ui/          # React components (.jsx) — interactive pieces
    layout/      # Astro components (.astro) — static structure
  pages/         # .astro files only (Astro handles routing)
  hooks/         # custom React hooks
  utils/         # helper functions
```

### Key Libraries to Add as Needed

Data fetching: @tanstack/react-query (for client-side fetching inside React islands)
Global state: zustand (works well across Astro + React islands)
Forms: react-hook-form
Styling: Tailwind( great Astro support), CSS modules or styled components

### Data Flow Pattern

```
Astro fetches data at build time → passes as props to React component → 
user interaction → React state updates → UI re-renders
```

### Rule of Thumb – Astro vs React


Use .astro for
Use .jsx for
Layouts, pages, nav
Forms, modals, dropdowns
Static content
Anything with onClick, useState
SEO-critical content
Real-time or dynamic UI


### Deployment

Vercel and Netlify both support Astro out of the box - connect your repo and deploy
Build command: npm run build -> outputs to dist/
For SSR mode, add an adapter: npx astro add vercel or npx astro add netlify


This site is built with AstroJS and React and is hosted on Netlify connect to my repo, easy releases. The key mindset is to default to Astro and reach for React only when you need interactivity. Less Js shipped eq faster site! Happy coding!




