import { expandedBooks } from "./expandedBooks";

export type CuratedBook = {
  id: string;
  query: string;
  title: string;
  author: string;
  tags: string[];
  synopsis?: string;
  fallbackCoverUrl?: string;
};

const coverUrls: Record<string, string> = {
  almond: "https://covers.openlibrary.org/b/id/11654300-L.jpg",
  "midnight-library": "https://covers.openlibrary.org/b/id/10313767-L.jpg",
  "before-coffee-gets-cold": "https://covers.openlibrary.org/b/id/10138333-L.jpg",
  "lonely-castle": "https://covers.openlibrary.org/b/id/13335986-L.jpg",
  "convenience-store-woman": "https://covers.openlibrary.org/b/id/9315164-L.jpg",
  "a-good-girls-guide": "https://covers.openlibrary.org/b/id/13156188-L.jpg",
  "truly-devious": "https://covers.openlibrary.org/b/id/8367745-L.jpg",
  "the-inheritance-games": "https://covers.openlibrary.org/b/id/10472357-L.jpg",
  "better-than-the-movies": "https://covers.openlibrary.org/b/id/11182600-L.jpg",
  "today-tonight-tomorrow": "https://covers.openlibrary.org/b/id/11204566-L.jpg",
  "the-cat-who-saved-books": "https://covers.openlibrary.org/b/id/11099841-L.jpg",
  "anxious-people": "https://covers.openlibrary.org/b/id/10087939-L.jpg",
  "one-of-us-is-lying": "https://covers.openlibrary.org/b/id/12503935-L.jpg",
  "we-were-liars": "https://covers.openlibrary.org/b/id/14425312-L.jpg",
  "they-both-die-at-the-end": "https://covers.openlibrary.org/b/id/9280553-L.jpg",
  "radio-silence": "https://covers.openlibrary.org/b/id/8797626-L.jpg",
  "heartstopper-one": "https://covers.openlibrary.org/b/id/9020805-L.jpg",
  "youve-reached-sam": "https://covers.openlibrary.org/b/id/11058809-L.jpg",
  "if-he-had-been-with-me": "https://covers.openlibrary.org/b/id/14339089-L.jpg",
  "summer-i-turned-pretty": "https://covers.openlibrary.org/b/id/7719210-L.jpg",
  "to-all-the-boys": "https://covers.openlibrary.org/b/id/7370711-L.jpg",
  "love-and-gelato": "https://covers.openlibrary.org/b/id/8074552-L.jpg",
  "the-hating-game": "https://covers.openlibrary.org/b/id/9247684-L.jpg",
  "beach-read": "https://covers.openlibrary.org/b/id/9426296-L.jpg",
  "seven-husbands": "https://covers.openlibrary.org/b/id/8354226-L.jpg",
  "daisy-jones": "https://covers.openlibrary.org/b/id/8742674-L.jpg",
  "silent-patient": "https://covers.openlibrary.org/b/id/9407338-L.jpg",
  "the-guest-list": "https://covers.openlibrary.org/b/id/10096112-L.jpg",
  "thursday-murder-club": "https://covers.openlibrary.org/b/id/10201431-L.jpg",
  "the-naturals": "https://covers.openlibrary.org/b/id/10318713-L.jpg",
  "five-survive": "https://covers.openlibrary.org/b/id/13187233-L.jpg",
  "rachel-price": "https://covers.openlibrary.org/b/id/14605870-L.jpg",
  "ace-of-spades": "https://covers.openlibrary.org/b/id/11253161-L.jpg",
  legendborn: "https://covers.openlibrary.org/b/id/10323535-L.jpg",
  "six-of-crows": "https://covers.openlibrary.org/b/id/12667417-L.jpg",
  "shadow-and-bone": "https://covers.openlibrary.org/b/id/13816048-L.jpg",
  "deadly-education": "https://covers.openlibrary.org/b/id/10206042-L.jpg",
  "cruel-prince": "https://covers.openlibrary.org/b/id/8361789-L.jpg",
  caraval: "https://covers.openlibrary.org/b/id/7990753-L.jpg",
  "sorcery-of-thorns": "https://covers.openlibrary.org/b/id/10136514-L.jpg",
  "cerulean-sea": "https://covers.openlibrary.org/b/id/9312772-L.jpg",
  "irregular-witches": "https://covers.openlibrary.org/b/id/14656782-L.jpg",
  "the-spellshop": "https://covers.openlibrary.org/b/id/15202687-L.jpg",
  "the-maid": "https://covers.openlibrary.org/b/id/11199954-L.jpg",
  "everyone-in-my-family": "https://covers.openlibrary.org/b/id/13260574-L.jpg",
  "project-hail-mary": "https://covers.openlibrary.org/b/id/11200092-L.jpg",
  "dark-matter": "https://covers.openlibrary.org/b/id/7436634-L.jpg",
  "the-martian": "https://covers.openlibrary.org/b/id/11447888-L.jpg",
  "tomorrow-tomorrow-tomorrow": "https://covers.openlibrary.org/b/id/12859975-L.jpg",
  "lessons-in-chemistry": "https://covers.openlibrary.org/b/id/12725772-L.jpg",
  "eleanor-oliphant": "https://covers.openlibrary.org/b/id/8415055-L.jpg",
  "normal-people": "https://covers.openlibrary.org/b/id/8794265-L.jpg",
  "perks-wallflower": "https://covers.openlibrary.org/b/id/14315052-L.jpg",
  "turtles-all-the-way-down": "https://covers.openlibrary.org/b/id/8283871-L.jpg",
  "darius-great": "https://covers.openlibrary.org/b/id/9274780-L.jpg",
  "i-want-to-eat-your-pancreas": "https://covers.openlibrary.org/b/id/10270475-L.jpg",
  "no-longer-human": "https://covers.openlibrary.org/b/id/13190147-L.jpg",
  "devotion-suspect-x": "https://covers.openlibrary.org/b/id/6677764-L.jpg",
  "girl-on-the-train": "https://covers.openlibrary.org/b/id/7350360-L.jpg",
  "the-book-thief": "https://covers.openlibrary.org/b/id/8153054-L.jpg",
};

const synopsisById: Record<string, string> = {
  almond:
    "A boy who cannot feel emotion is pulled into a violent friendship that slowly teaches him how grief, fear, and connection work.",
  "midnight-library":
    "Between life and death, Nora finds a library of lives she could have lived and has to decide what actually makes a life worth staying for.",
  "before-coffee-gets-cold":
    "In a small Tokyo cafe, visitors can travel to one moment in the past, but the rules are strict and the emotional cost is real.",
  "lonely-castle":
    "A lonely student discovers a portal to a magical castle where other kids like her are hiding from the world and from their own pain.",
  "convenience-store-woman":
    "Keiko feels most normal inside a convenience store, until society starts pushing her to want the life everyone else expects.",
  "a-good-girls-guide":
    "A student reopens a closed murder case for a school project and starts finding clues that people in town wanted buried.",
  "truly-devious":
    "At an elite academy with a famous unsolved kidnapping, a true-crime obsessed student starts chasing old clues as new danger appears.",
  "the-inheritance-games":
    "A broke teenager inherits a billionaire's fortune and enters a mansion full of puzzles, secrets, and heirs who want answers.",
  "better-than-the-movies":
    "A rom-com lover tries to land her dream crush, but her annoying neighbor keeps turning every plan into a better story.",
  "today-tonight-tomorrow":
    "Two academic rivals spend one last day of high school competing across Seattle and realizing their rivalry may be something softer.",
  "the-cat-who-saved-books":
    "A grieving boy and a talking cat enter strange worlds to rescue books, readers, and the courage to move forward.",
  "anxious-people":
    "A failed bank robbery traps a group of strangers together, revealing messy private lives beneath a very chaotic hostage situation.",
  "one-of-us-is-lying":
    "Five students walk into detention, but only four leave alive, turning every secret and alibi into a suspect list.",
  "we-were-liars":
    "A privileged island family hides a summer tragedy behind wealth, romance, and fractured memories that refuse to stay buried.",
  "they-both-die-at-the-end":
    "Two strangers are told they will die today, so they spend their final hours trying to live honestly for once.",
  "radio-silence":
    "A high-achieving student bonds with the creator of her favorite podcast and starts questioning the future everyone planned for her.",
  "heartstopper-one":
    "Two boys at school become friends, then something warmer, in a gentle story about crushes, identity, and feeling seen.",
  "youve-reached-sam":
    "After losing her boyfriend, Julie gets one impossible phone call with him and must decide how long to hold on.",
  "if-he-had-been-with-me":
    "Childhood best friends drift apart through high school, but their unfinished feelings keep circling a future they may not get.",
  "summer-i-turned-pretty":
    "One beach house, two brothers, and one summer change Belly's friendships, first love, and sense of who she is becoming.",
  "to-all-the-boys":
    "Lara Jean's secret love letters are mailed to every crush she ever had, forcing her quiet fantasies into real life.",
  "love-and-gelato":
    "In Italy, Lina follows her mother's old journal through grief, family secrets, and a romance she never expected.",
  "the-hating-game":
    "Two office rivals turn every workday into a battle, until the tension between them becomes impossible to explain away.",
  "beach-read":
    "Two blocked writers with opposite styles swap genres for the summer and discover the stories they avoid are the ones they need.",
  "seven-husbands":
    "A legendary Hollywood actress finally tells the truth about her seven marriages, one forbidden love, and the price of fame.",
  "daisy-jones":
    "A magnetic singer joins a rising rock band, creating the kind of chemistry that makes music history and personal wreckage.",
  "silent-patient":
    "A famous painter shoots her husband and stops speaking, leaving a therapist obsessed with uncovering the reason.",
  "the-guest-list":
    "A glamorous island wedding turns deadly as old grudges, secrets, and jealousies surface among the guests.",
  "thursday-murder-club":
    "Four retirees in a peaceful village investigate cold cases for fun, until a real murder lands at their doorstep.",
  "the-naturals":
    "A teenager with a gift for reading people joins an FBI program where profiling killers becomes dangerously personal.",
  "five-survive":
    "Six friends in an RV are trapped by a sniper, and one of them is hiding the secret that made them targets.",
  "rachel-price":
    "A girl filming a documentary about her missing mother is thrown into chaos when the woman suddenly returns with impossible answers.",
  "ace-of-spades":
    "At an elite school, anonymous messages expose two students' private lives and reveal a larger, uglier game being played.",
  legendborn:
    "After her mother's death, Bree enters a secret magical society and uncovers a legacy tied to grief, power, and ancestry.",
  "six-of-crows":
    "A crew of young criminals takes on an impossible heist where every member has skills, scars, and something to prove.",
  "shadow-and-bone":
    "A soldier discovers a rare power that could save her war-torn country, if court politics and darkness do not consume her first.",
  "deadly-education":
    "In a monster-filled magical school, survival is brutal, alliances are risky, and one powerful girl refuses to become the villain.",
  "cruel-prince":
    "A mortal girl raised in a dangerous faerie court learns that power, cruelty, and desire are all games she must master.",
  caraval:
    "Two sisters enter a magical performance where every clue feels staged, every bargain has teeth, and nothing is quite safe.",
  "sorcery-of-thorns":
    "A library apprentice accused of sabotage joins forces with a sorcerer to uncover a threat hidden inside magical books.",
  "cerulean-sea":
    "A rule-following caseworker visits a home for unusual children and finds a gentler, braver version of life waiting there.",
  "irregular-witches":
    "A lonely witch is hired to teach three young witches in a secret house and finds messy magic, family, and belonging.",
  "the-spellshop":
    "A runaway librarian shelters on an island with stolen spellbooks, jam-making magic, and a chance to build a softer life.",
  "the-maid":
    "A hotel maid who notices everything becomes a murder suspect, then has to use her unusual perspective to clear her name.",
  "everyone-in-my-family":
    "A family reunion in the mountains turns into a murder mystery narrated by someone who insists every relative has killed before.",
  "project-hail-mary":
    "A lone astronaut wakes with no memory on a desperate mission to save Earth, then finds help in the most unexpected place.",
  "dark-matter":
    "A man is abducted into a version of his life that should not exist and fights through alternate realities to return home.",
  "the-martian":
    "Stranded on Mars, one astronaut uses science, stubbornness, and humor to stay alive long enough for rescue to become possible.",
  "tomorrow-tomorrow-tomorrow":
    "Two childhood friends build video games together, turning creativity, ambition, love, and resentment into a lifelong partnership.",
  "lessons-in-chemistry":
    "A brilliant chemist pushed out of science becomes a TV cooking star and turns every episode into a lesson in power.",
  "eleanor-oliphant":
    "A lonely, rigid woman starts letting people into her carefully controlled life and slowly faces the past she has buried.",
  "normal-people":
    "Two classmates move in and out of each other's lives, testing how love changes under class, silence, and growing up.",
  "perks-wallflower":
    "A quiet freshman writes letters about friendship, music, first love, and the memories he is not ready to face.",
  "turtles-all-the-way-down":
    "Aza investigates a missing billionaire while living inside spirals of anxiety that make trust and closeness feel dangerous.",
  "darius-great":
    "Darius travels to Iran, meets family he barely knows, and finds friendship while learning how to be less alone.",
  "i-want-to-eat-your-pancreas":
    "A reserved boy discovers a classmate's secret illness, and their unlikely bond turns ordinary days into something precious.",
  "no-longer-human":
    "A troubled young man performs normality for the world while privately sinking through shame, alienation, and self-destruction.",
  "devotion-suspect-x":
    "A brilliant mathematician helps cover up a crime, setting off a tense battle of logic with a detective who respects him.",
  "girl-on-the-train":
    "A woman watching strangers from a train becomes entangled in a disappearance, but her memory and credibility keep betraying her.",
  "the-book-thief":
    "In Nazi Germany, a girl steals books, finds a dangerous kind of family, and discovers words can wound and save.",
};

function book(
  id: string,
  query: string,
  title: string,
  author: string,
  tags: string[],
  fallbackCoverUrl?: string
): CuratedBook {
  return { id, query, title, author, tags, synopsis: synopsisById[id], fallbackCoverUrl: fallbackCoverUrl ?? coverUrls[id] };
}

const coreCuratedBooks: CuratedBook[] = [
  book("almond", "Almond Won Pyung Sohn", "Almond", "Won-Pyung Sohn", [
    "Anime arcs",
    "Psych reels",
    "Quiet overthinker",
    "A friendship saves them",
    "Emotional",
    "Easy snack",
    "short chapters",
  ], "https://covers.openlibrary.org/b/id/11654300-L.jpg"),
  book("midnight-library", "The Midnight Library Matt Haig", "The Midnight Library", "Matt Haig", [
    "Memory lane",
    "A life gets reset",
    "Quiet overthinker",
    "Psych reels",
    "second chances",
    "what-ifs",
  ]),
  book("before-coffee-gets-cold", "Before the Coffee Gets Cold Toshikazu Kawaguchi", "Before the Coffee Gets Cold", "Toshikazu Kawaguchi", [
    "K-drama ache",
    "Memory lane",
    "A life gets reset",
    "Emotional",
    "Easy snack",
    "short chapters",
  ]),
  book("lonely-castle", "Lonely Castle in the Mirror Mizuki Tsujimura", "Lonely Castle in the Mirror", "Mizuki Tsujimura", [
    "Anime arcs",
    "A friendship saves them",
    "Quiet overthinker",
    "Emotional",
    "found family",
  ]),
  book("convenience-store-woman", "Convenience Store Woman Sayaka Murata", "Convenience Store Woman", "Sayaka Murata", [
    "Psych reels",
    "Quiet overthinker",
    "Easy snack",
    "human behavior",
    "short chapters",
  ]),
  book("a-good-girls-guide", "A Good Girl's Guide to Murder Holly Jackson", "A Good Girl's Guide to Murder", "Holly Jackson", [
    "Crime docs",
    "Cold detective",
    "A mystery unfolds",
    "Thrilling",
    "fast hooks",
    "YA mystery",
  ]),
  book("truly-devious", "Truly Devious Maureen Johnson", "Truly Devious", "Maureen Johnson", [
    "Crime docs",
    "Elite campus",
    "A mystery unfolds",
    "Cold detective",
    "Thrilling",
  ]),
  book("the-inheritance-games", "The Inheritance Games Jennifer Lynn Barnes", "The Inheritance Games", "Jennifer Lynn Barnes", [
    "Elite campus",
    "A mystery unfolds",
    "Messy main character",
    "Thrilling",
    "fast hooks",
  ]),
  book("better-than-the-movies", "Better Than the Movies Lynn Painter", "Better Than the Movies", "Lynn Painter", [
    "Romance drama",
    "Hopeless romantic",
    "Two people collide",
    "Romantic",
    "banter",
    "Easy snack",
  ]),
  book("today-tonight-tomorrow", "Today Tonight Tomorrow Rachel Lynn Solomon", "Today Tonight Tomorrow", "Rachel Lynn Solomon", [
    "Romance drama",
    "Hopeless romantic",
    "Two people collide",
    "Elite campus",
    "Romantic",
    "rivalry",
  ]),
  book("the-cat-who-saved-books", "The Cat Who Saved Books Sosuke Natsukawa", "The Cat Who Saved Books", "Sosuke Natsukawa", [
    "Anime arcs",
    "A friendship saves them",
    "Cozy",
    "Easy snack",
    "books about books",
  ]),
  book("anxious-people", "Anxious People Fredrik Backman", "Anxious People", "Fredrik Backman", [
    "Psych reels",
    "Messy main character",
    "A friendship saves them",
    "Emotional",
    "human behavior",
  ]),
  book("one-of-us-is-lying", "One of Us Is Lying Karen M McManus", "One of Us Is Lying", "Karen M. McManus", [
    "Crime docs",
    "Elite campus",
    "A mystery unfolds",
    "Messy main character",
    "fast hooks",
  ]),
  book("we-were-liars", "We Were Liars E Lockhart", "We Were Liars", "E. Lockhart", [
    "Memory lane",
    "A mystery unfolds",
    "Messy main character",
    "Emotional",
    "fast hooks",
  ]),
  book("they-both-die-at-the-end", "They Both Die at the End Adam Silvera", "They Both Die at the End", "Adam Silvera", [
    "Memory lane",
    "Two people collide",
    "A life gets reset",
    "Emotional",
    "Hopeless romantic",
  ]),
  book("radio-silence", "Radio Silence Alice Oseman", "Radio Silence", "Alice Oseman", [
    "Psych reels",
    "Quiet overthinker",
    "A friendship saves them",
    "Elite campus",
    "Emotional",
  ]),
  book("heartstopper-one", "Heartstopper Volume One Alice Oseman", "Heartstopper: Volume One", "Alice Oseman", [
    "Romance drama",
    "Hopeless romantic",
    "Two people collide",
    "Easy snack",
    "short chapters",
  ]),
  book("youve-reached-sam", "Youve Reached Sam Dustin Thao", "You've Reached Sam", "Dustin Thao", [
    "K-drama ache",
    "Memory lane",
    "Hopeless romantic",
    "Emotional",
    "A life gets reset",
  ]),
  book("if-he-had-been-with-me", "If He Had Been with Me Laura Nowlin", "If He Had Been with Me", "Laura Nowlin", [
    "Romance drama",
    "K-drama ache",
    "Hopeless romantic",
    "Memory lane",
    "Emotional",
  ]),
  book("summer-i-turned-pretty", "The Summer I Turned Pretty Jenny Han", "The Summer I Turned Pretty", "Jenny Han", [
    "Romance drama",
    "Hopeless romantic",
    "Two people collide",
    "Memory lane",
    "Easy snack",
  ]),
  book("to-all-the-boys", "To All the Boys I Loved Before Jenny Han", "To All the Boys I've Loved Before", "Jenny Han", [
    "Romance drama",
    "Hopeless romantic",
    "Two people collide",
    "K-drama ache",
    "Easy snack",
  ]),
  book("love-and-gelato", "Love and Gelato Jenna Evans Welch", "Love and Gelato", "Jenna Evans Welch", [
    "Romance drama",
    "Hopeless romantic",
    "Memory lane",
    "Two people collide",
    "Easy snack",
  ]),
  book("the-hating-game", "The Hating Game Sally Thorne", "The Hating Game", "Sally Thorne", [
    "Romance drama",
    "Hopeless romantic",
    "Two people collide",
    "fast hooks",
    "banter",
  ]),
  book("beach-read", "Beach Read Emily Henry", "Beach Read", "Emily Henry", [
    "Romance drama",
    "Messy main character",
    "Two people collide",
    "Memory lane",
    "Romantic",
  ]),
  book("seven-husbands", "The Seven Husbands of Evelyn Hugo Taylor Jenkins Reid", "The Seven Husbands of Evelyn Hugo", "Taylor Jenkins Reid", [
    "Romance drama",
    "Memory lane",
    "Messy main character",
    "A mystery unfolds",
    "Emotional",
  ]),
  book("daisy-jones", "Daisy Jones and The Six Taylor Jenkins Reid", "Daisy Jones & The Six", "Taylor Jenkins Reid", [
    "Romance drama",
    "Messy main character",
    "Memory lane",
    "fast hooks",
    "Emotional",
  ]),
  book("silent-patient", "The Silent Patient Alex Michaelides", "The Silent Patient", "Alex Michaelides", [
    "Crime docs",
    "Psych reels",
    "Cold detective",
    "A mystery unfolds",
    "Thrilling",
  ]),
  book("the-guest-list", "The Guest List Lucy Foley", "The Guest List", "Lucy Foley", [
    "Crime docs",
    "A mystery unfolds",
    "Messy main character",
    "Thrilling",
    "fast hooks",
  ]),
  book("thursday-murder-club", "The Thursday Murder Club Richard Osman", "The Thursday Murder Club", "Richard Osman", [
    "Crime docs",
    "A mystery unfolds",
    "Cold detective",
    "Cozy",
    "Easy snack",
  ]),
  book("the-naturals", "The Naturals Jennifer Lynn Barnes", "The Naturals", "Jennifer Lynn Barnes", [
    "Crime docs",
    "Cold detective",
    "A mystery unfolds",
    "Psych reels",
    "fast hooks",
  ]),
  book("five-survive", "Five Survive Holly Jackson", "Five Survive", "Holly Jackson", [
    "Crime docs",
    "A mystery unfolds",
    "Messy main character",
    "Thrilling",
    "fast hooks",
  ]),
  book("rachel-price", "The Reappearance of Rachel Price Holly Jackson", "The Reappearance of Rachel Price", "Holly Jackson", [
    "Crime docs",
    "Memory lane",
    "A mystery unfolds",
    "Cold detective",
    "Thrilling",
  ]),
  book("ace-of-spades", "Ace of Spades Faridah Abike Iyimide", "Ace of Spades", "Faridah Abike-Iyimide", [
    "Crime docs",
    "Elite campus",
    "A mystery unfolds",
    "Messy main character",
    "Thrilling",
  ]),
  book("legendborn", "Legendborn Tracy Deonn", "Legendborn", "Tracy Deonn", [
    "Anime arcs",
    "Elite campus",
    "A mystery unfolds",
    "Messy main character",
    "fast hooks",
  ]),
  book("six-of-crows", "Six of Crows Leigh Bardugo", "Six of Crows", "Leigh Bardugo", [
    "Anime arcs",
    "A mystery unfolds",
    "Messy main character",
    "Thrilling",
    "fast hooks",
  ]),
  book("shadow-and-bone", "Shadow and Bone Leigh Bardugo", "Shadow and Bone", "Leigh Bardugo", [
    "Anime arcs",
    "Two people collide",
    "A mystery unfolds",
    "Messy main character",
    "fast hooks",
  ]),
  book("deadly-education", "A Deadly Education Naomi Novik", "A Deadly Education", "Naomi Novik", [
    "Anime arcs",
    "Elite campus",
    "Cold detective",
    "A mystery unfolds",
    "fast hooks",
  ]),
  book("cruel-prince", "The Cruel Prince Holly Black", "The Cruel Prince", "Holly Black", [
    "Anime arcs",
    "Elite campus",
    "Two people collide",
    "Messy main character",
    "Thrilling",
  ]),
  book("caraval", "Caraval Stephanie Garber", "Caraval", "Stephanie Garber", [
    "Anime arcs",
    "A mystery unfolds",
    "Two people collide",
    "Romance drama",
    "fast hooks",
  ]),
  book("sorcery-of-thorns", "Sorcery of Thorns Margaret Rogerson", "Sorcery of Thorns", "Margaret Rogerson", [
    "Anime arcs",
    "Hopeless romantic",
    "Two people collide",
    "A mystery unfolds",
    "Cozy",
  ]),
  book("cerulean-sea", "The House in the Cerulean Sea TJ Klune", "The House in the Cerulean Sea", "TJ Klune", [
    "Psych reels",
    "Quiet overthinker",
    "A friendship saves them",
    "Cozy",
    "Emotional",
  ]),
  book("irregular-witches", "The Very Secret Society of Irregular Witches Sangu Mandanna", "The Very Secret Society of Irregular Witches", "Sangu Mandanna", [
    "K-drama ache",
    "Hopeless romantic",
    "A friendship saves them",
    "Cozy",
    "Easy snack",
  ]),
  book("the-spellshop", "The Spellshop Sarah Beth Durst", "The Spellshop", "Sarah Beth Durst", [
    "K-drama ache",
    "Hopeless romantic",
    "A friendship saves them",
    "Cozy",
    "Easy snack",
  ]),
  book("the-maid", "The Maid Nita Prose", "The Maid", "Nita Prose", [
    "Crime docs",
    "Quiet overthinker",
    "A mystery unfolds",
    "Cozy",
    "Easy snack",
  ]),
  book("everyone-in-my-family", "Everyone in My Family Has Killed Someone Benjamin Stevenson", "Everyone in My Family Has Killed Someone", "Benjamin Stevenson", [
    "Crime docs",
    "Messy main character",
    "A mystery unfolds",
    "fast hooks",
    "Thrilling",
  ]),
  book("project-hail-mary", "Project Hail Mary Andy Weir", "Project Hail Mary", "Andy Weir", [
    "Anime arcs",
    "A friendship saves them",
    "Quiet overthinker",
    "fast hooks",
    "Thrilling",
  ]),
  book("dark-matter", "Dark Matter Blake Crouch", "Dark Matter", "Blake Crouch", [
    "Psych reels",
    "A life gets reset",
    "A mystery unfolds",
    "Thrilling",
    "fast hooks",
  ]),
  book("the-martian", "The Martian Andy Weir", "The Martian", "Andy Weir", [
    "Anime arcs",
    "Quiet overthinker",
    "A friendship saves them",
    "fast hooks",
    "Easy snack",
  ]),
  book("tomorrow-tomorrow-tomorrow", "Tomorrow and Tomorrow and Tomorrow Gabrielle Zevin", "Tomorrow, and Tomorrow, and Tomorrow", "Gabrielle Zevin", [
    "Psych reels",
    "A friendship saves them",
    "Memory lane",
    "Messy main character",
    "Emotional",
  ]),
  book("lessons-in-chemistry", "Lessons in Chemistry Bonnie Garmus", "Lessons in Chemistry", "Bonnie Garmus", [
    "Psych reels",
    "Messy main character",
    "A friendship saves them",
    "Memory lane",
    "Easy snack",
  ]),
  book("eleanor-oliphant", "Eleanor Oliphant Is Completely Fine Gail Honeyman", "Eleanor Oliphant Is Completely Fine", "Gail Honeyman", [
    "Psych reels",
    "Quiet overthinker",
    "A friendship saves them",
    "Emotional",
    "human behavior",
  ]),
  book("normal-people", "Normal People Sally Rooney", "Normal People", "Sally Rooney", [
    "Romance drama",
    "K-drama ache",
    "Two people collide",
    "Memory lane",
    "Messy main character",
  ]),
  book("perks-wallflower", "The Perks of Being a Wallflower Stephen Chbosky", "The Perks of Being a Wallflower", "Stephen Chbosky", [
    "Psych reels",
    "Quiet overthinker",
    "A friendship saves them",
    "Memory lane",
    "Emotional",
  ]),
  book("turtles-all-the-way-down", "Turtles All the Way Down John Green", "Turtles All the Way Down", "John Green", [
    "Psych reels",
    "Quiet overthinker",
    "A mystery unfolds",
    "Emotional",
    "human behavior",
  ]),
  book("darius-great", "Darius the Great Is Not Okay Adib Khorram", "Darius the Great Is Not Okay", "Adib Khorram", [
    "Psych reels",
    "Quiet overthinker",
    "A friendship saves them",
    "Memory lane",
    "Emotional",
  ]),
  book("i-want-to-eat-your-pancreas", "I Want to Eat Your Pancreas Yoru Sumino", "I Want to Eat Your Pancreas", "Yoru Sumino", [
    "Anime arcs",
    "K-drama ache",
    "Hopeless romantic",
    "Memory lane",
    "Emotional",
  ]),
  book("no-longer-human", "No Longer Human Osamu Dazai", "No Longer Human", "Osamu Dazai", [
    "Anime arcs",
    "Psych reels",
    "Quiet overthinker",
    "Memory lane",
    "Emotional",
  ]),
  book("devotion-suspect-x", "The Devotion of Suspect X Keigo Higashino", "The Devotion of Suspect X", "Keigo Higashino", [
    "Crime docs",
    "Cold detective",
    "A mystery unfolds",
    "Psych reels",
    "Thrilling",
  ]),
  book("girl-on-the-train", "The Girl on the Train Paula Hawkins", "The Girl on the Train", "Paula Hawkins", [
    "Crime docs",
    "Messy main character",
    "A mystery unfolds",
    "Psych reels",
    "Thrilling",
  ]),
  book("the-book-thief", "The Book Thief Markus Zusak", "The Book Thief", "Markus Zusak", [
    "Memory lane",
    "A friendship saves them",
    "Quiet overthinker",
    "Emotional",
    "books about books",
  ]),
];

export const curatedBooks: CuratedBook[] = [...coreCuratedBooks, ...expandedBooks].slice(0, 2000);
