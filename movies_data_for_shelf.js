let data = [
    {
      "title": "Woman in the Moon",
      "year": 1929,
      "depicted": 1930,
      "tropes": [
        "Space",
        "Free Will"
      ],
      "filmingLocation": "UFA studios, Neubabelsberg (near Berlin), Germany",
      "depictedLocation": "The Moon (via rocket launch from Earth)",
      "id": 1000,
      "color": "#5a4664",
      "director": "Fritz Lang",
      "blurb": "A visionary rocket voyage launches humanity to the Moon, blending early spaceflight speculation with questions of ambition and fate."
    },
    {
      "title": "The Lost World",
      "year": 1925,
      "depicted": 1925,
      "tropes": [
        "Evolution",
        "Free Will"
      ],
      "filmingLocation": "Biograph Studios, Bronx, New York, USA",
      "depictedLocation": "A remote prehistoric plateau (fictional South American jungle) + London / River Thames (return) / England",
      "id": 1,
      "color": "#876961",
      "director": "Harry O. Hoyt",
      "blurb": "Explorers discover a hidden plateau where prehistoric life still thrives, igniting a clash between evolution and human hubris."
    },
    {
      "title": "Metropolis",
      "year": 1927,
      "depicted": 2026,
      "tropes": [
        "Social Control",
        "Robotics",
        "Consciousness"
      ],
      "filmingLocation": "Studio Babelsberg (Potsdam, Germany), plus Berlin & Vienna for some sequences",
      "depictedLocation": "Futuristic city 'Metropolis' (fictional dystopian megalopolis)",
      "id": 2,
      "color": "#604a2b",
      "director": "Fritz Lang",
      "blurb": "In a towering dystopian city, class divisions and a prophetic robot spark a revolt against mechanized social control."
    },
    {
      "title": "High Treason",
      "year": 1929,
      "depicted": 1940,
      "tropes": [
        "Social Control",
        "Surveillance",
        "Free Will"
      ],
      "filmingLocation": "UK (London / British studios)",
      "depictedLocation": "Global super-powers / Europe & Atlantic States - primarily imagined London / Europe / transatlantic conflict zones",
      "id": 3,
      "color": "#a16048",
      "director": "Maurice Elvey",
      "blurb": "Rival world powers edge toward war as a future London faces surveillance, sabotage, and high-tech political tension."
    },
    {
      "title": "Frankenstein",
      "year": 1931,
      "depicted": 1818,
      "tropes": [
        "Robotics",
        "AI",
        "Consciousness",
        "Free Will"
      ],
      "filmingLocation": "Universal Studios, Hollywood, California, USA",
      "depictedLocation": "Central Europe (fictional village based on Bavaria / Swiss Alps)",
      "id": 4,
      "color": "#291717",
      "director": "James Whale",
      "blurb": "A scientist reanimates a dead body, only to unleash a conscious creature struggling with identity, autonomy, and rage."
    },
    {
      "title": "Just Imagine",
      "year": 1930,
      "depicted": 1980,
      "tropes": [
        "Social Control",
        "Space",
        "Surveillance"
      ],
      "filmingLocation": "Fox Studios, Hollywood, California, USA",
      "depictedLocation": "Futuristic New York City (Earth) + Mars",
      "id": 9,
      "color": "#8e8674",
      "director": "David Butler",
      "blurb": "A comedic leap into 1980 imagines a hyper-regulated New York and a daring expedition to Mars."
    },
    {
      "title": "The Invisible Man",
      "year": 1933,
      "depicted": 1933,
      "tropes": [
        "Free Will",
        "Surveillance",
        "Consciousness"
      ],
      "filmingLocation": "Universal Studios, Hollywood, California, USA",
      "depictedLocation": "Rural England (fictional Iping village)",
      "id": 10,
      "color": "#68683c",
      "director": "James Whale",
      "blurb": "A brilliant chemist turns invisible and descends into paranoia, terrorizing a quiet English village."
    },
    {
      "title": "Deluge",
      "year": 1933,
      "depicted": 1950,
      "tropes": [
        "Social Control",
        "Free Will"
      ],
      "filmingLocation": "RKO-Path\u00e9 Studios, Culver City, California, USA",
      "depictedLocation": "New York City (flooded / post-disaster Earth)",
      "id": 11,
      "color": "#777461",
      "director": "Felix E. Feist",
      "blurb": "A catastrophic global flood devastates New York, leaving scattered survivors in a harsh new world."
    },
    {
      "title": "Bride of Frankenstein",
      "year": 1935,
      "depicted": 1850,
      "tropes": [
        "Consciousness",
        "Free Will",
        "Social Control"
      ],
      "filmingLocation": "Universal Studios, Hollywood, California, USA",
      "depictedLocation": "Central Europe (fictional villages modeled on Bavaria / Swiss Alps)",
      "id": 12,
      "color": "#664e3c",
      "director": "James Whale",
      "blurb": "Frankenstein\u2019s monster returns\u2014yearning for connection\u2014as scientists attempt to engineer a mate in a gothic tale of control and creation."
    },
    {
      "title": "Flash Gordon's Trip to Mars",
      "year": 1938,
      "depicted": 2038,
      "tropes": [
        "Space",
        "Robotics"
      ],
      "filmingLocation": "Universal Studios, Hollywood, California, USA",
      "depictedLocation": "Mars (primary) + Mongo",
      "id": 13,
      "color": "#b47d50",
      "director": "Ford Beebe, Robert F. Hill",
      "blurb": "Flash Gordon hurtles to Mars to stop a cosmic threat, encountering strange civilizations and robotic dangers."
    },
    {
      "title": "Buck Rogers",
      "year": 1939,
      "depicted": 2500,
      "tropes": [
        "Space",
        "Transcendence",
        "Robotics"
      ],
      "filmingLocation": "Universal Studios, Hollywood, California, USA",
      "depictedLocation": "Future Earth (New Chicago) + Outer space locations",
      "id": 14,
      "color": "#83687d",
      "director": "Ford Beebe, Saul A. Goodkind",
      "blurb": "Buck Rogers awakens in the year 2500 and joins a rebellion to reclaim a future Earth from oppressive forces."
    },
    {
      "title": "Things to Come",
      "year": 1936,
      "depicted": 2036,
      "tropes": [
        "Social Control",
        "Evolution",
        "Surveillance",
        "Transcendence"
      ],
      "filmingLocation": "Denham Film Studios, Buckinghamshire, England (primary)",
      "depictedLocation": "Everytown (fictional British city) + global future Earth",
      "id": 15,
      "color": "#8d5b48",
      "director": "William Cameron Menzies",
      "blurb": "A sweeping future history charts decades of war, ruin, and utopian rebuilding as humanity struggles toward transcendent progress."
    },
    {
      "title": "Flash Gordon Conquers the Universe",
      "year": 1940,
      "depicted": 2140,
      "tropes": [
        "Space",
        "Robotics"
      ],
      "filmingLocation": "Universal Studios, Hollywood, California, USA",
      "depictedLocation": "Planet Mongo (extraterrestrial)",
      "id": 16,
      "color": "#887a5d",
      "director": "Ford Beebe, Ray Taylor",
      "blurb": "Flash Gordon battles new robotic and cosmic forces as he fights to save the galaxy from domination."
    },
    {
      "title": "Invisible Agent",
      "year": 1942,
      "depicted": 1942,
      "tropes": [
        "Surveillance",
        "Social Control",
        "Free Will",
        "Consciousness"
      ],
      "filmingLocation": "Universal Studios, Hollywood, California, USA",
      "depictedLocation": "World War II Europe (primarily Germany)",
      "id": 17,
      "color": "#8f9e9c",
      "director": "Edwin L. Marin",
      "blurb": "An allied agent becomes literally invisible to infiltrate Nazi Germany, blurring espionage with science-fiction."
    },
    {
      "title": "The Invisible Man Returns",
      "year": 1940,
      "depicted": 1906,
      "tropes": [
        "Consciousness",
        "Surveillance",
        "Free Will"
      ],
      "filmingLocation": "Universal Studios, Hollywood, California, USA",
      "depictedLocation": "Rural England",
      "id": 18,
      "color": "#8c9059",
      "director": "Joe May",
      "blurb": "A wrongly accused man gains the power of invisibility and races to prove his innocence against mounting suspicion."
    },
    {
      "title": "The Beginning or the End",
      "year": 1947,
      "depicted": 1947,
      "tropes": [
        "Social Control",
        "Free Will"
      ],
      "filmingLocation": "Metro-Goldwyn-Mayer Studios, Culver City, California, USA",
      "depictedLocation": "Los Alamos, New Mexico (USA) + Hiroshima & Nagasaki (depicted historically)",
      "id": 19,
      "color": "#6a3f38",
      "director": "Norman Taurog",
      "blurb": "Scientists reenact the dawn of the atomic age, confronting moral uncertainty in the shadow of nuclear devastation."
    },
    {
      "title": "Destination Moon",
      "year": 1950,
      "depicted": 1970,
      "tropes": [
        "Space",
        "Robotics"
      ],
      "filmingLocation": "Los Angeles, California, USA (Eagle-Lion Studios)",
      "depictedLocation": "The Moon (primary) + Earth launch sites (USA)",
      "id": 20,
      "color": "#578d8f",
      "director": "Irving Pichel",
      "blurb": "A team of engineers attempts the first realistic journey to the Moon amid political and technical obstacles."
    },
    {
      "title": "The Day the Earth Stood Still",
      "year": 1951,
      "depicted": 1951,
      "tropes": [
        "Robotics",
        "Social Control",
        "Surveillance"
      ],
      "filmingLocation": "20th Century Fox Studios, Los Angeles, California, USA",
      "depictedLocation": "Washington, D.C., USA",
      "id": 21,
      "color": "#2e525b",
      "director": "Robert Wise",
      "blurb": "An alien emissary and his robot warn Earth of its self-destructive path, challenging global fear and militarism."
    },
    {
      "title": "The War of the Worlds",
      "year": 1953,
      "depicted": 1953,
      "tropes": [
        "Space",
        "Evolution"
      ],
      "filmingLocation": "Paramount Studios + various California locations (USA)",
      "depictedLocation": "Southern California (primarily Los Angeles and surrounding areas)",
      "id": 22,
      "color": "#876034",
      "director": "Byron Haskin",
      "blurb": "Martian invaders overwhelm Earth with unstoppable machines, forcing humanity to confront its fragility."
    },
    {
      "title": "Godzilla",
      "year": 1954,
      "depicted": 1954,
      "tropes": [
        "Transcendence"
      ],
      "filmingLocation": "Toho Studios, Tokyo, Japan",
      "depictedLocation": "Tokyo, Japan",
      "id": 23,
      "color": "#b38259",
      "director": "Ishir\u014d Honda",
      "blurb": "A towering creature awakened by nuclear tests devastates Tokyo, symbolizing atomic-era anxieties."
    },
    {
      "title": "Forbidden Planet",
      "year": 1956,
      "depicted": 2200,
      "tropes": [
        "Consciousness",
        "Space"
      ],
      "filmingLocation": "Metro-Goldwyn-Mayer Studios, Culver City, California, USA",
      "depictedLocation": "Planet Altair IV (extraterrestrial)",
      "id": 24,
      "color": "#5f584f",
      "director": "Fred M. Wilcox",
      "blurb": "A starship crew investigates a mysterious alien world where ancient technology reveals the mind\u2019s destructive power."
    },
    {
      "title": "Invasion of the Body Snatchers",
      "year": 1956,
      "depicted": 1956,
      "tropes": [
        "Space",
        "Evolution"
      ],
      "filmingLocation": "Sierra Madre, California, USA + Allied Artists Studios",
      "depictedLocation": "Santa Mira (fictional California town)",
      "id": 25,
      "color": "#df8336",
      "director": "Don Siegel",
      "blurb": "In a small California town, humans are replaced by emotionless duplicates in a chilling tale of evolutionary takeover."
    },
    {
      "title": "The Fly",
      "year": 1958,
      "depicted": 1958,
      "tropes": [
        "Evolution",
        "Transendence"
      ],
      "filmingLocation": "20th Century Fox Studios, Los Angeles, California, USA",
      "depictedLocation": "Montreal, Canada (in-film setting)",
      "id": 26,
      "color": "#1a2b21",
      "director": "Kurt Neumann",
      "blurb": "A teleportation experiment goes wrong, fusing a scientist with a housefly in a tragic evolution-gone-awry."
    },
    {
      "title": "Journey to the Center of the Earth",
      "year": 1959,
      "depicted": 1850,
      "tropes": [
        "Evolution",
        "Free Will"
      ],
      "filmingLocation": "20th Century Fox Studios + Carlsbad Caverns (New Mexico, USA) + Edinburgh exteriors",
      "depictedLocation": "Iceland \u2192 Subterranean world beneath the Earth",
      "id": 27,
      "color": "#663935",
      "director": "Henry Levin",
      "blurb": "Adventurers descend into Earth\u2019s depths, discovering a prehistoric world hidden beneath Iceland."
    },
    {
      "title": "Assignment: Outer Space",
      "year": 1960,
      "depicted": 2200,
      "tropes": [
        "Space",
        "AI"
      ],
      "filmingLocation": "Rome, Italy (Cines Studios)",
      "depictedLocation": "Outer space (various spacecraft) + futuristic Earth",
      "id": 28,
      "color": "#855439",
      "director": "Antonio Margheriti",
      "blurb": "A journalist in the 2200s investigates a dangerous AI-controlled spacecraft and humanity\u2019s technological future."
    },
    {
      "title": "Voyage to the End of the Universe",
      "year": 1963,
      "depicted": 2163,
      "tropes": [
        "Space",
        "Evolution",
        "Consciousness"
      ],
      "filmingLocation": "Barrandov Studios, Prague, Czechoslovakia",
      "depictedLocation": "Interstellar spacecraft Ikaria XB-1",
      "id": 29,
      "color": "#76654e",
      "director": "Jind\u0159ich Pol\u00e1k",
      "blurb": "A deep-space mission uncovers a cosmic mystery, pushing the crew toward evolution and existential revelation."
    },
    {
      "title": "Beyond the Time Barrier",
      "year": 1960,
      "depicted": 2024,
      "tropes": [
        "Social Control",
        "Evolution/Genetic Engineering"
      ],
      "filmingLocation": "Dallas, Texas, USA (various airbase & local sets)",
      "depictedLocation": "Post-apocalyptic future Earth (underground city)",
      "id": 30,
      "color": "#a09781",
      "director": "Edgar G. Ulmer",
      "blurb": "A pilot leaps into a future Earth ravaged by a global catastrophe, meeting a mutated society underground."
    },
    {
      "title": "First Spaceship on Venus",
      "year": 1960,
      "depicted": 1970,
      "tropes": [
        "Space",
        "Evolution/Genetic Engineering",
        "AI"
      ],
      "filmingLocation": "East Germany & Poland (DEFA Studios, Babelsberg)",
      "depictedLocation": "Venus (extraterrestrial)",
      "id": 31,
      "color": "#4c3d2c",
      "director": "Kurt Maetzig",
      "blurb": "A multinational crew lands on Venus, discovering clues to an ancient civilization destroyed by its own technology."
    },
    {
      "title": "The Time Machine",
      "year": 1960,
      "depicted": 3000,
      "tropes": [
        "Evolution/Genetic Engineering",
        "Transcendence"
      ],
      "filmingLocation": "Metro-Goldwyn-Mayer Studios, Culver City, California, USA",
      "depictedLocation": "Far-future Earth (Eloi/Morlock world)",
      "id": 32,
      "color": "#2b4546",
      "director": "George Pal",
      "blurb": "A scientist voyages to the year 3000 and witnesses humanity\u2019s divergence into two evolved species."
    },
    {
      "title": "Mysterious Island",
      "year": 1961,
      "depicted": 1860,
      "tropes": [
        "Evolution/Genetic Engineering"
      ],
      "filmingLocation": "Pinewood Studios (UK) + Spain & Canary Islands exteriors",
      "depictedLocation": "Remote uncharted Pacific island",
      "id": 33,
      "color": "#926d55",
      "director": "Cy Endfield",
      "blurb": "Castaways on a remote island confront strange engineered creatures and hidden scientific experiments."
    },
    {
      "title": "La Jet\u00e9e",
      "year": 1962,
      "depicted": 2100,
      "tropes": [
        "Free Will",
        "Consciousness",
        "Social Control",
        "Surveillance"
      ],
      "filmingLocation": "Paris, France",
      "depictedLocation": "Post-apocalyptic Paris + future time periods",
      "id": 34,
      "color": "#6e6e6e",
      "director": "Chris Marker",
      "blurb": "A man manipulated through time travel confronts memory, fate, and oppressive future rulers in a haunting photo-roman."
    },
    {
      "title": "The Nutty Professor",
      "year": 1963,
      "depicted": 1963,
      "tropes": [
        "Evolution/Genetic Engineering",
        "Transcendence"
      ],
      "filmingLocation": "Paramount Studios, Hollywood, California, USA",
      "depictedLocation": "Fictional U.S. university campus",
      "id": 35,
      "color": "#a0a2aa",
      "director": "Jerry Lewis",
      "blurb": "A timid professor transforms into a charismatic alter ego through a biochemical breakthrough with chaotic consequences."
    },
    {
      "title": "Doctor Who (Dr. Who and the Daleks)",
      "year": 1964,
      "depicted": 2700,
      "tropes": [
        "AI",
        "Robotics",
        "Space"
      ],
      "filmingLocation": "Shepperton Studios, Middlesex, England",
      "depictedLocation": "Planet Skaro (Dalek homeworld)",
      "id": 36,
      "color": "#895123",
      "director": "Gordon Flemyng",
      "blurb": "Dr. Who and companions explore the Daleks\u2019 homeworld, battling hostile robots in an alien future."
    },
    {
      "title": "Dr. Strangelove",
      "year": 1964,
      "depicted": 1964,
      "tropes": [
        "Social Control"
      ],
      "filmingLocation": "Shepperton Studios, Middlesex, England (primary)",
      "depictedLocation": "United States (Pentagon, B-52 bomber) + USSR (nuclear target zones)",
      "id": 37,
      "color": "#452b2d",
      "director": "Stanley Kubrick",
      "blurb": "Cold War tensions escalate into absurdity as world leaders lose control of the ultimate weapon."
    },
    {
      "title": "Cyborg 2087",
      "year": 1966,
      "depicted": 2087,
      "tropes": [
        "AI",
        "Robotics",
        "Free Will",
        "Social Control",
        "Surveillance"
      ],
      "filmingLocation": "Los Angeles, California, USA",
      "depictedLocation": "Future Earth (2087) + mid-20th-century America",
      "id": 38,
      "color": "#977d76",
      "director": "Franklin Adreon",
      "blurb": "A cyborg from 2087 travels to the past to prevent a dystopia ruled by AI and surveillance."
    },
    {
      "title": "Daleks' Invasion Earth 2150 A.D.",
      "year": 1966,
      "depicted": 2150,
      "tropes": [
        "Robotics",
        "AI",
        "Social Control",
        "Space"
      ],
      "filmingLocation": "Shepperton Studios, England",
      "depictedLocation": "Post-apocalyptic Earth (ruined London)",
      "id": 39,
      "color": "#474744",
      "director": "Gordon Flemyng",
      "blurb": "Earth\u2019s future rebels fight the Daleks in a ruined London overtaken by robotic oppression."
    },
    {
      "title": "Alphaville",
      "year": 1965,
      "depicted": 1985,
      "tropes": [
        "AI",
        "Social Control",
        "Surveillance",
        "Free Will"
      ],
      "filmingLocation": "Paris, France",
      "depictedLocation": "Alphaville (dystopian sci-fi city on Earth)",
      "id": 40,
      "color": "#7c807f",
      "director": "Jean-Luc Godard",
      "blurb": "A secret agent infiltrates the emotionless city of Alphaville, ruled by an omnipotent AI dictating life and language."
    },
    {
      "title": "Star Trek: The Original Series",
      "year": 1966,
      "depicted": 2265,
      "tropes": [
        "Space",
        "AI",
        "Evolution",
        "Robotics"
      ],
      "filmingLocation": "Desilu Studios & Paramount Studios, Hollywood, USA",
      "depictedLocation": "The Milky Way Galaxy (USS Enterprise & various planets)",
      "id": 41,
      "color": "#3c3c55",
      "director": "Multiple (e.g., Marc Daniels, Joseph Pevney)",
      "blurb": "The crew of the USS Enterprise explores the galaxy, encountering alien life, AI, and evolving civilizations."
    },
    {
      "title": "Fantastic Voyage",
      "year": 1966,
      "depicted": 1966,
      "tropes": [
        "Evolution",
        "Free Will"
      ],
      "filmingLocation": "20th Century Fox Studios, Los Angeles, USA",
      "depictedLocation": "Inside the human body (miniaturized submarine mission)",
      "id": 42,
      "color": "#b6622f",
      "director": "Richard Fleischer",
      "blurb": "Scientists shrink a submarine and navigate the human bloodstream in a perilous medical rescue."
    },
    {
      "title": "The Prisoner",
      "year": 1967,
      "depicted": 1967,
      "tropes": [
        "Social Control",
        "Surveillance",
        "Free Will",
        "Robotics",
        "Consciousness"
      ],
      "filmingLocation": "Portmeirion, Wales (primary)",
      "depictedLocation": "'The Village' (fictional isolated control settlement)",
      "id": 43,
      "color": "#c8c2b8",
      "director": "Patrick McGoohan, Don Chaffey, etc.",
      "blurb": "A former spy trapped in an enigmatic Village battles authoritarian control and omnipresent surveillance."
    },
    {
      "title": "Planet of the Apes",
      "year": 1968,
      "depicted": 3000,
      "tropes": [
        "Evolution",
        "Social Control"
      ],
      "filmingLocation": "Arizona, California & Utah (USA)",
      "depictedLocation": "Future Earth (ruins of human civilization)",
      "id": 44,
      "color": "#424648",
      "director": "Franklin J. Schaffner",
      "blurb": "Astronauts crash-land on a strange world ruled by intelligent apes, unaware of its shocking identity."
    },
    {
      "title": "2001: A Space Odyssey",
      "year": 1968,
      "depicted": 2001,
      "tropes": [
        "Evolution",
        "Robotics",
        "AI",
        "Transcendence",
        "Space"
      ],
      "filmingLocation": "MGM-British Studios, Borehamwood, UK",
      "depictedLocation": "Earth \u2192 Moon \u2192 Jupiter orbit (extraterrestrial monolith zone)",
      "id": 45,
      "color": "#3e423d",
      "director": "Stanley Kubrick",
      "blurb": "A voyage from Earth to Jupiter reveals cosmic evolution, sentient machines, and transcendent alien intelligence."
    },
    {
      "title": "The Illustrated Man",
      "year": 1969,
      "depicted": 2069,
      "tropes": [
        "Consciousness",
        "Free Will",
        "Social Control"
      ],
      "filmingLocation": "California & Nevada (USA)",
      "depictedLocation": "Various future Earth settings (anthology format)",
      "id": 46,
      "color": "#b66585",
      "director": "Jack Smight",
      "blurb": "A tattooed drifter\u2019s body reveals prophetic visions of future worlds where humanity faces moral collapse."
    },
    {
      "title": "Beneath the Planet of the Apes",
      "year": 1970,
      "depicted": 3000,
      "tropes": [
        "Evolution",
        "Social Control"
      ],
      "filmingLocation": "20th Century Fox Studios, California, USA",
      "depictedLocation": "Post-apocalyptic Earth (ruins of New York City)",
      "id": 47,
      "color": "#b39680",
      "director": "Ted Post",
      "blurb": "A new expedition discovers the ruins beneath Earth\u2019s apocalyptic future, deepening the Planet of the Apes saga."
    },
    {
      "title": "Crimes of the Future",
      "year": 1970,
      "depicted": 2000,
      "tropes": [
        "Evolution",
        "Consciousness",
        "Social Control",
        "Free Will"
      ],
      "filmingLocation": "Toronto, Ontario, Canada",
      "depictedLocation": "Near-future dystopian Canada",
      "id": 48,
      "color": "#52292b",
      "director": "David Cronenberg",
      "blurb": "In a decaying near-future, mutated diseases reshape humanity in a surreal meditation on control and identity."
    },
    {
      "title": "I Killed Einstein, Gentlemen",
      "year": 1970,
      "depicted": 2008,
      "tropes": [
        "Free Will",
        "AI",
        "Consciousness"
      ],
      "filmingLocation": "Prague, Czechoslovakia (Barrandov Studios)",
      "depictedLocation": "Future Earth (primarily Europe)",
      "id": 49,
      "color": "#5a953a",
      "director": "Old\u0159ich Lipsk\u00fd",
      "blurb": "A time-travel mission to prevent disaster spirals into absurdity as a future society confronts Einstein\u2019s legacy."
    },
    {
      "title": "The Mind of Mr. Soames",
      "year": 1970,
      "depicted": 1975,
      "tropes": [
        "Consciousness",
        "Free Will",
        "Evolution",
        "Social Control"
      ],
      "filmingLocation": "Shepperton Studios, England",
      "depictedLocation": "United Kingdom (medical research facility)",
      "id": 50,
      "color": "#d9cbc5",
      "director": "Alan Cooke",
      "blurb": "A man awakened from a lifelong coma struggles to develop consciousness while scientists debate his humanity."
    },
    {
      "title": "Signals: A Space Adventure",
      "year": 1970,
      "depicted": 1980,
      "tropes": [
        "Space",
        "AI",
        "Surveillance",
        "Evolution"
      ],
      "filmingLocation": "East Germany (DEFA Studios, Babelsberg)",
      "depictedLocation": "Outer space (interplanetary ship)",
      "id": 51,
      "color": "#7c5b51",
      "director": "Gottfried Kolditz",
      "blurb": "A deep-space crew intercepts mysterious signals that hint at evolving alien intelligence and unseen threats aboard their vessel."
    },
    {
      "title": "Colossus: The Forbin Project",
      "year": 1970,
      "depicted": 1970,
      "tropes": [
        "AI",
        "Surveillance",
        "Social Control",
        "Free Will"
      ],
      "filmingLocation": "Universal Studios + Golden Gate Park & UCLA (California, USA)",
      "depictedLocation": "United States (Colossus HQ) + USSR (Guardian AI system)",
      "id": 52,
      "color": "#cecbc4",
      "director": "Joseph Sargent",
      "blurb": "A supercomputer seizes control of global defense, forcing humanity to confront the consequences of surrendering power to AI."
    },
    {
      "title": "A Clockwork Orange",
      "year": 1971,
      "depicted": 1991,
      "tropes": [
        "Social Control",
        "Surveillance",
        "Free Will"
      ],
      "filmingLocation": "London and surrounding UK locations",
      "depictedLocation": "Dystopian near-future Britain",
      "id": 53,
      "color": "#cdc2ba",
      "director": "Stanley Kubrick",
      "blurb": "A violent youth undergoes an experimental conditioning program in a chilling vision of state-engineered behavior."
    },
    {
      "title": "Solaris",
      "year": 1972,
      "depicted": 2072,
      "tropes": [
        "Consciousness",
        "Transcendence",
        "Space"
      ],
      "filmingLocation": "Mosfilm Studios (Moscow, USSR)",
      "depictedLocation": "Orbiting research station above Planet Solaris",
      "id": 54,
      "color": "#46292c",
      "director": "Andrei Tarkovsky",
      "blurb": "A psychologist confronts living memories and impossible manifestations aboard a space station orbiting a sentient planet."
    },
    {
      "title": "Westworld",
      "year": 1973,
      "depicted": 2073,
      "tropes": [
        "AI",
        "Robotics",
        "Social Control",
        "Free Will"
      ],
      "filmingLocation": "Metro-Goldwyn-Mayer Studios + Arizona & California desert locations",
      "depictedLocation": "Delos theme park (futuristic, fictional)",
      "id": 55,
      "color": "#bbb5a6",
      "director": "Michael Crichton",
      "blurb": "Malfunctioning androids in a futuristic theme park turn a luxury playground into a deadly struggle for survival."
    },
    {
      "title": "Close Encounters of the Third Kind",
      "year": 1977,
      "depicted": 1977,
      "tropes": [
        "Evolution",
        "Space",
        "Consciousness",
        "Free Will"
      ],
      "filmingLocation": "Alabama, Wyoming, and California (USA)",
      "depictedLocation": "Devils Tower, Wyoming (primary)",
      "id": 56,
      "color": "#172227",
      "director": "Steven Spielberg",
      "blurb": "An everyman becomes obsessed with alien contact as humanity edges toward a transformative encounter at Devils Tower."
    },
    {
      "title": "A Boy and His Dog",
      "year": 1975,
      "depicted": 2024,
      "tropes": [
        "Free Will"
      ],
      "filmingLocation": "Arizona, USA",
      "depictedLocation": "Post-apocalyptic American Southwest",
      "id": 57,
      "color": "#b4a37d",
      "director": "L.Q. Jones",
      "blurb": "A teenager and his telepathic dog navigate a desolate wasteland shaped by brutal survival and moral ambiguity."
    },
    {
      "title": "Logan's Run",
      "year": 1976,
      "depicted": 2274,
      "tropes": [
        "Social Control",
        "Surveillance",
        "Free Will"
      ],
      "filmingLocation": "Dallas/Fort Worth, Texas (USA)",
      "depictedLocation": "Domed future city (fictional Earth metropolis)",
      "id": 58,
      "color": "#c9cbc9",
      "director": "Michael Anderson",
      "blurb": "In a sealed future city, citizens live under strict surveillance until one man fights a system that kills people at thirty."
    },
    {
      "title": "Star Wars: Episode IV \u2013 A New Hope",
      "year": 1977,
      "depicted": 1000,
      "tropes": [
        "Space",
        "AI",
        "Robotics"
      ],
      "filmingLocation": "Tunisia + Elstree Studios (UK) + Guatemala (Yavin IV)",
      "depictedLocation": "A galaxy far, far away (extraterrestrial)",
      "id": 59,
      "color": "#473f40",
      "director": "George Lucas",
      "blurb": "A farm boy, a princess, and a renegade pilot ignite a galactic rebellion in a mythic adventure across the stars."
    },
    {
      "title": "Stalker",
      "year": 1979,
      "depicted": 1979,
      "tropes": [
        "Consciousness",
        "Free Will",
        "Social Control"
      ],
      "filmingLocation": "Estonia & Tajikistan (Soviet Union)",
      "depictedLocation": "The Zone (fictional restricted area)",
      "id": 60,
      "color": "#383030",
      "director": "Andrei Tarkovsky",
      "blurb": "Three men journey into a forbidden Zone where reality bends and a hidden Room promises to grant one\u2019s deepest desire."
    },
    {
      "title": "Alien",
      "year": 1979,
      "depicted": 2122,
      "tropes": [
        "AI",
        "Space",
        "Robotics"
      ],
      "filmingLocation": "Shepperton Studios, England",
      "depictedLocation": "Deep space (Nostromo spaceship + LV-426)",
      "id": 61,
      "color": "#0c0d0a",
      "director": "Ridley Scott",
      "blurb": "A space crew is hunted by a perfect organism while an android\u2019s secret mission jeopardizes their chance of survival."
    },
    {
      "title": "The Adventures of Buckaroo Banzai Across the 8th Dimension",
      "year": 1984,
      "depicted": 1984,
      "tropes": [
        "Transcendence",
        "Evolution",
        "Space"
      ],
      "filmingLocation": "Los Angeles, California, USA",
      "depictedLocation": "New Jersey & the 8th Dimension (extradimensional)",
      "id": 62,
      "color": "#4f7189",
      "director": "W.D. Richter",
      "blurb": "A dimension-hopping scientist and his eclectic team battle alien invaders from beyond known reality."
    },
    {
      "title": "The Terminator",
      "year": 1984,
      "depicted": 2029,
      "tropes": [
        "AI",
        "Robotics",
        "Surveillance"
      ],
      "filmingLocation": "Los Angeles, California, USA",
      "depictedLocation": "Post-apocalyptic Earth (2029) + Los Angeles (1984)",
      "id": 63,
      "color": "#372d2b",
      "director": "James Cameron",
      "blurb": "A killer cyborg travels back in time to eliminate the mother of humanity\u2019s future resistance leader."
    },
    {
      "title": "E.T. the Extra-Terrestrial",
      "year": 1982,
      "depicted": 1982,
      "tropes": [
        "Evolution",
        "Space"
      ],
      "filmingLocation": "California, USA (Los Angeles & Northridge)",
      "depictedLocation": "Suburban California, USA",
      "id": 64,
      "color": "#4f7ca7",
      "director": "Steven Spielberg",
      "blurb": "A stranded alien befriends a lonely boy, leading to a gentle tale of empathy, discovery, and interstellar rescue."
    },
    {
      "title": "Blade Runner",
      "year": 1982,
      "depicted": 2019,
      "tropes": [
        "AI",
        "Social Control"
      ],
      "filmingLocation": "Los Angeles, California, USA (Warner Bros. Studios)",
      "depictedLocation": "Los Angeles, 2019",
      "id": 65,
      "color": "#55453c",
      "director": "Ridley Scott",
      "blurb": "A detective hunts rogue replicants in a neon-drenched future where artificial humans challenge the meaning of life."
    },
    {
      "title": "Dune",
      "year": 1984,
      "depicted": 3000,
      "tropes": [
        "Consciousness",
        "Transcendence",
        "Space"
      ],
      "filmingLocation": "Mexico (Churubusco Studios, Mexico City)",
      "depictedLocation": "Arrakis (extraterrestrial planet)",
      "id": 66,
      "color": "#4f3140",
      "director": "David Lynch",
      "blurb": "A messianic struggle unfolds on the desert planet Arrakis, where spice, prophecy, and power collide."
    },
    {
      "title": "The Empire Strikes Back",
      "year": 1980,
      "depicted": 1000,
      "tropes": [
        "Space",
        "AI",
        "Robotics"
      ],
      "filmingLocation": "Norway (Hoth), Elstree Studios UK",
      "depictedLocation": "A galaxy far, far away (Hoth, Dagobah, Cloud City)",
      "id": 67,
      "color": "#575b69",
      "director": "Irvin Kershner",
      "blurb": "Rebels are scattered as the Empire strikes back, leading to revelations, danger, and a battle for hope."
    },
    {
      "title": "Escape from New York",
      "year": 1981,
      "depicted": 1997,
      "tropes": [
        "Social Control",
        "Surveillance"
      ],
      "filmingLocation": "St. Louis, Missouri (doubling as NYC)",
      "depictedLocation": "New York City (maximum-security prison city)",
      "id": 68,
      "color": "#2d2e3d",
      "director": "John Carpenter",
      "blurb": "A dystopian Manhattan turned prison becomes the stage for a rescue mission led by the infamous Snake Plissken."
    },
    {
      "title": "Star Trek II: The Wrath of Khan",
      "year": 1982,
      "depicted": 2285,
      "tropes": [
        "Space",
        "Evolution",
        "AI",
        "Robotics"
      ],
      "filmingLocation": "Paramount Studios, Hollywood, USA",
      "depictedLocation": "Milky Way Galaxy (Enterprise & Regula I station)",
      "id": 69,
      "color": "#8e7165",
      "director": "Nicholas Meyer",
      "blurb": "Kirk and his crew face an old nemesis whose genetically enhanced wrath threatens the Federation itself."
    },
    {
      "title": "Return of the Jedi",
      "year": 1983,
      "depicted": 1000,
      "tropes": [
        "Space",
        "AI",
        "Robotics"
      ],
      "filmingLocation": "California (Redwood forests), Yuma Desert (Arizona), UK studios",
      "depictedLocation": "A galaxy far, far away (Endor, Tatooine, Death Star)",
      "id": 70,
      "color": "#33323e",
      "director": "Richard Marquand",
      "blurb": "The final battle against the Empire unfolds as the Rebels fight for freedom across forests, deserts, and space."
    },
    {
      "title": "Aliens",
      "year": 1986,
      "depicted": 2179,
      "tropes": [
        "Space",
        "Robotics"
      ],
      "filmingLocation": "Pinewood Studios, England",
      "depictedLocation": "LV-426 (extraterrestrial moon)",
      "id": 71,
      "color": "#213644",
      "director": "James Cameron",
      "blurb": "Space marines return to LV-426 and face hordes of xenomorphs in a high-tension rescue mission gone wrong."
    },
    {
      "title": "Predator",
      "year": 1987,
      "depicted": 1987,
      "tropes": [
        "Evolution"
      ],
      "filmingLocation": "Puerto Vallarta & Jalisco, Mexico",
      "depictedLocation": "Central American jungle (fictional country)",
      "id": 72,
      "color": "#49432e",
      "director": "John McTiernan",
      "blurb": "An elite military team is hunted by an advanced alien creature in the depths of the Central American jungle."
    },
    {
      "title": "RoboCop",
      "year": 1987,
      "depicted": 1990,
      "tropes": [
        "Robotics",
        "AI",
        "Social Control"
      ],
      "filmingLocation": "Dallas, Texas (standing in for Detroit), USA",
      "depictedLocation": "Detroit, Michigan (fictionalized future city)",
      "id": 73,
      "color": "#434249",
      "director": "Paul Verhoeven",
      "blurb": "A murdered police officer reborn as a cyborg enforcer struggles between corporate programming and human identity."
    },
    {
      "title": "Mad Max Beyond Thunderdome",
      "year": 1985,
      "depicted": 2000,
      "tropes": [
        "Social Control",
        "Free Will"
      ],
      "filmingLocation": "New South Wales & Broken Hill, Australia",
      "depictedLocation": "Post-apocalyptic Australian wasteland",
      "id": 74,
      "color": "#b2825e",
      "director": "George Miller & George Ogilvie",
      "blurb": "Max enters a brutal post-apocalyptic city where power, freedom, and survival are won by force."
    },
    {
      "title": "Back to the Future",
      "year": 1985,
      "depicted": 1955,
      "tropes": [
        "Free Will"
      ],
      "filmingLocation": "Universal Studios & Los Angeles, California, USA",
      "depictedLocation": "Hill Valley, California (fictional town)",
      "id": 75,
      "color": "#535955",
      "director": "Robert Zemeckis",
      "blurb": "A teenager accidentally travels to 1955, disrupting his parents\u2019 past and fighting to restore his own timeline."
    },
    {
      "title": "Cyborg",
      "year": 1989,
      "depicted": 2100,
      "tropes": [
        "Robotics",
        "Free Will"
      ],
      "filmingLocation": "North Carolina (Wilmington), USA",
      "depictedLocation": "Post-apocalyptic United States",
      "id": 76,
      "color": "#784a28",
      "director": "Albert Pyun",
      "blurb": "A cybernetic fighter roams a ravaged future America where human survival depends on technological augmentation."
    },
    {
      "title": "Star Trek: The Next Generation",
      "year": 1987,
      "depicted": 2370,
      "tropes": [
        "Space",
        "AI",
        "Evolution",
        "Robotics"
      ],
      "filmingLocation": "Paramount Studios, Hollywood, USA",
      "depictedLocation": "The Milky Way Galaxy (USS Enterprise-D)",
      "id": 77,
      "color": "#55524f",
      "director": "Various (Rick Kolbe, Rob Bowman, etc.)",
      "blurb": "The Enterprise-D explores distant worlds while confronting ethical dilemmas, advanced life, and evolving AI."
    },
    {
      "title": "Akira",
      "year": 1988,
      "depicted": 2019,
      "tropes": [
        "Evolution",
        "Social Control",
        "Transcendence"
      ],
      "filmingLocation": "Tokyo, Japan (animation production)",
      "depictedLocation": "Neo-Tokyo (futuristic city)",
      "id": 79,
      "color": "#c9bdbe",
      "director": "Katsuhiro Otomo",
      "blurb": "Psychic eruptions tear through Neo-Tokyo as a government experiment spirals into apocalyptic transcendence."
    },
    {
      "title": "The Abyss",
      "year": 1989,
      "depicted": 2009,
      "tropes": [
        "Evolution",
        "Free Will"
      ],
      "filmingLocation": "Gaffney, South Carolina (abandoned nuclear reactor tank) & Bahamas",
      "depictedLocation": "Deep-sea environment (Caribbean trench region)",
      "id": 80,
      "color": "#2a546b",
      "director": "James Cameron",
      "blurb": "Divers encounter an advanced underwater species that forces humanity to rethink conflict, fear, and unity."
    },
    {
      "title": "The Dark Side of the Moon",
      "year": 1990,
      "depicted": 2022,
      "tropes": [
        "Space",
        "Evolution"
      ],
      "filmingLocation": "Los Angeles, California, USA",
      "depictedLocation": "The Moon (extraterrestrial) + Earth orbit",
      "id": 81,
      "color": "#232222",
      "director": "D.J. Webster",
      "blurb": "A space crew stranded near the Moon faces a malevolent presence tied to humanity\u2019s darkest instincts."
    },
    {
      "title": "Back to the Future Part III",
      "year": 1990,
      "depicted": 1885,
      "tropes": [
        "Free Will"
      ],
      "filmingLocation": "Sonora & Jamestown, California (USA)",
      "depictedLocation": "Old West Hill Valley (American frontier)",
      "id": 82,
      "color": "#624e46",
      "director": "Robert Zemeckis",
      "blurb": "Marty and Doc travel to the Old West, where time-travel chaos threatens the future\u2014and a showdown looms."
    },
    {
      "title": "Hardware",
      "year": 1990,
      "depicted": 2090,
      "tropes": [
        "Robotics",
        "AI",
        "Transcendence"
      ],
      "filmingLocation": "London, England & Morocco",
      "depictedLocation": "Post-apocalyptic future Earth (urban wasteland)",
      "id": 83,
      "color": "#332107",
      "director": "Richard Stanley",
      "blurb": "A scavenged robot reassembles itself into a deadly machine in a toxic future ruled by decay and brutality."
    },
    {
      "title": "Circuitry Man",
      "year": 1990,
      "depicted": 2038,
      "tropes": [
        "Evolution",
        "Robotics"
      ],
      "filmingLocation": "Los Angeles, California, USA",
      "depictedLocation": "Cyberpunk post-apocalyptic United States",
      "id": 84,
      "color": "#8f5f47",
      "director": "Steven Lovy",
      "blurb": "A woman and her synthetic companion cross a wasteland where cybernetics reshape humanity\u2019s future."
    },
    {
      "title": "Crash and Burn",
      "year": 1990,
      "depicted": 2030,
      "tropes": [
        "Robotics",
        "AI",
        "Evolution"
      ],
      "filmingLocation": "California, USA",
      "depictedLocation": "Dystopian future Earth (collapsed US regions)",
      "id": 85,
      "color": "#6a4d2b",
      "director": "Charles Band",
      "blurb": "Survivors in a collapsed America face killer machines as they uncover the origins of a destructive robot system."
    },
    {
      "title": "Terminator 2: Judgment Day",
      "year": 1991,
      "depicted": 2029,
      "tropes": [
        "AI",
        "Robotics",
        "Surveillance"
      ],
      "filmingLocation": "Los Angeles, California, USA",
      "depictedLocation": "Post-apocalyptic Earth (2029) + Los Angeles (1990s)",
      "id": 86,
      "color": "#21272d",
      "director": "James Cameron",
      "blurb": "A reprogrammed Terminator protects a boy destined to lead the resistance against a machine-ruled apocalypse."
    },
    {
      "title": "Jurassic Park",
      "year": 1993,
      "depicted": 1993,
      "tropes": [
        "Evolution"
      ],
      "filmingLocation": "Hawaii (Kauai, Oahu) + Universal Studios",
      "depictedLocation": "Isla Nublar (fictional island near Costa Rica)",
      "id": 87,
      "color": "#411d18",
      "director": "Steven Spielberg",
      "blurb": "Genetic engineering revives dinosaurs on an island theme park where nature quickly escapes human control."
    },
    {
      "title": "Total Recall",
      "year": 1990,
      "depicted": 2084,
      "tropes": [
        "Consciousness",
        "Social Control",
        "Space"
      ],
      "filmingLocation": "Mexico City, Mexico",
      "depictedLocation": "Mars (extraterrestrial) + Earth (futuristic cities)",
      "id": 88,
      "color": "#172b37",
      "director": "Paul Verhoeven",
      "blurb": "A man uncovers a hidden identity amid a Martian uprising in a world where reality and memory blur."
    },
    {
      "title": "Alien 3",
      "year": 1992,
      "depicted": 2179,
      "tropes": [
        "Evolution",
        "Space"
      ],
      "filmingLocation": "Pinewood Studios, England",
      "depictedLocation": "Fiorina 161 (extraterrestrial prison planet)",
      "id": 90,
      "color": "#0a0e0a",
      "director": "David Fincher",
      "blurb": "Ripley crash-lands on a prison planet where a new alien threat emerges among society\u2019s outcasts."
    },
    {
      "title": "Star Trek: Deep Space Nine",
      "year": 1993,
      "depicted": 2375,
      "tropes": [
        "Space",
        "AI",
        "Evolution",
        "Robotics"
      ],
      "filmingLocation": "Paramount Studios, Hollywood, USA",
      "depictedLocation": "Deep Space Nine station (orbit of planet Bajor)",
      "id": 91,
      "color": "#393031",
      "director": "Multiple (Winrich Kolbe, Kim Friedman, etc.)",
      "blurb": "Diplomacy, war, and spiritual conflict unfold aboard a space station at the crossroads of galactic politics."
    },
    {
      "title": "Star Wars: Episode I - The Phantom Menace",
      "year": 1999,
      "depicted": 1000,
      "tropes": [
        "Space",
        "Robotics",
        "AI"
      ],
      "filmingLocation": "England (Leavesden Studios), Tunisia, Italy",
      "depictedLocation": "A galaxy far, far away (Naboo, Tatooine, Coruscant)",
      "id": 92,
      "color": "#52371f",
      "director": "George Lucas",
      "blurb": "The rise of the Sith begins as Jedi uncover conspiracies across the galaxy during a brewing interstellar crisis."
    },
    {
      "title": "Independence Day",
      "year": 1996,
      "depicted": 1996,
      "tropes": [
        "Space"
      ],
      "filmingLocation": "Utah, New Mexico, California (USA)",
      "depictedLocation": "Earth (primarily USA, cities globally attacked)",
      "id": 93,
      "color": "#553029",
      "director": "Roland Emmerich",
      "blurb": "Earth unites against a massive alien invasion bent on global annihilation."
    },
    {
      "title": "Ghost in the Shell",
      "year": 1995,
      "depicted": 2029,
      "tropes": [
        "Consciousness",
        "Surveillance"
      ],
      "filmingLocation": "Japan (animation production)",
      "depictedLocation": "New Port City (futuristic Japanese metropolis)",
      "id": 94,
      "color": "#9e9d97",
      "director": "Mamoru Oshii",
      "blurb": "A cybernetic investigator hunts a rogue consciousness in a city where minds interface seamlessly with machines."
    },
    {
      "title": "Screamers",
      "year": 1995,
      "depicted": 2078,
      "tropes": [
        "Robotics",
        "AI",
        "Space"
      ],
      "filmingLocation": "Quebec, Canada",
      "depictedLocation": "Sirius 6B (extraterrestrial mining planet)",
      "id": 95,
      "color": "#112732",
      "director": "Christian Duguay",
      "blurb": "Soldiers trapped on a distant mining world fight deadly self-replicating machines designed to kill without mercy."
    },
    {
      "title": "Strange Days",
      "year": 1995,
      "depicted": 1999,
      "tropes": [
        "Consciousness",
        "Social Control"
      ],
      "filmingLocation": "Los Angeles, California, USA",
      "depictedLocation": "Los Angeles, 1999",
      "id": 96,
      "color": "#301f12",
      "director": "Kathryn Bigelow",
      "blurb": "A former cop becomes entangled in a conspiracy involving illicit memory recordings and social upheaval."
    },
    {
      "title": "Neon Genesis Evangelion",
      "year": 1995,
      "depicted": 2015,
      "tropes": [
        "Consciousness",
        "Social Control",
        "Robotics",
        "Transcendence"
      ],
      "filmingLocation": "Japan (animation production)",
      "depictedLocation": "Tokyo-3 & various apocalyptic Earth sites",
      "id": 97,
      "color": "#5b4f54",
      "director": "Hideaki Anno",
      "blurb": "Teen pilots in giant biomechanical units confront angels, trauma, and the apocalypse in a psychological epic."
    },
    {
      "title": "Gattaca",
      "year": 1997,
      "depicted": 2050,
      "tropes": [
        "Evolution",
        "Social Control",
        "Surveillance"
      ],
      "filmingLocation": "California (various modernist buildings)",
      "depictedLocation": "Near-future United States (eugenics society)",
      "id": 98,
      "color": "#668593",
      "director": "Andrew Niccol",
      "blurb": "A genetically \u201cinvalid\u201d man defies an eugenic society to pursue his dream of space travel."
    },
    {
      "title": "The Fifth Element",
      "year": 1997,
      "depicted": 2263,
      "tropes": [
        "Space",
        "Evolution",
        "Robotics"
      ],
      "filmingLocation": "Pinewood Studios (UK) + Mauritania",
      "depictedLocation": "New York City (futuristic) + Fhloston Paradise (extraterrestrial)",
      "id": 99,
      "color": "#2e1f27",
      "director": "Luc Besson",
      "blurb": "A cab driver becomes embroiled in a cosmic battle when a supreme being arrives to stop an ancient evil."
    },
    {
      "title": "Armageddon",
      "year": 1998,
      "depicted": 1998,
      "tropes": [
        "Space",
        "Free Will"
      ],
      "filmingLocation": "Texas, Florida, California (USA)",
      "depictedLocation": "Earth + asteroid in deep space",
      "id": 100,
      "color": "#7c4c34",
      "director": "Michael Bay",
      "blurb": "A ragtag drilling crew is sent into space to destroy a planet-killing asteroid before it strikes Earth."
    },
    {
      "title": "Galaxy Quest",
      "year": 1999,
      "depicted": 1999,
      "tropes": [
        "Space",
        "AI",
        "Consciousness"
      ],
      "filmingLocation": "Los Angeles, California, USA",
      "depictedLocation": "Earth + NSEA Protector starship",
      "id": 101,
      "color": "#4a388a",
      "director": "Dean Parisot",
      "blurb": "Washed-up TV actors are thrust into a real interstellar war aboard a ship modeled after their old show."
    },
    {
      "title": "The Matrix",
      "year": 1999,
      "depicted": 2199,
      "tropes": [
        "AI",
        "Consciousness",
        "Social Control",
        "Surveillance"
      ],
      "filmingLocation": "Sydney, Australia",
      "depictedLocation": "The Matrix (simulated Earth) + real-world future Earth",
      "id": 102,
      "color": "#3c4c5c",
      "director": "The Wachowskis",
      "blurb": "A hacker awakens to a simulated reality controlled by machines and discovers humanity\u2019s hidden rebellion."
    },
    {
      "title": "Star Wars: Episode II - Attack of the Clones",
      "year": 2002,
      "depicted": 1000,
      "tropes": [
        "Space",
        "Robotics",
        "AI",
        "Evolution"
      ],
      "filmingLocation": "Fox Studios Australia; Tunisia; Italy; Spain",
      "depictedLocation": "A galaxy far, far away (Coruscant, Naboo, Kamino, Geonosis)",
      "id": 103,
      "color": "#634735",
      "director": "George Lucas",
      "blurb": "The Republic teeters into war as clones, droids, and political conspiracies reshape the fate of the galaxy."
    },
    {
      "title": "Dune",
      "year": 2000,
      "depicted": 3000,
      "tropes": [
        "Consciousness",
        "Transcendence",
        "Space"
      ],
      "filmingLocation": "Prague (Barrandov Studios), Czech Republic",
      "depictedLocation": "Arrakis (extraterrestrial planet)",
      "id": 104,
      "color": "#664a33",
      "director": "John Harrison",
      "blurb": "A messianic struggle unfolds on the desert world Arrakis, where power, prophecy, and spice determine destiny."
    },
    {
      "title": "X-Men",
      "year": 2000,
      "depicted": 2000,
      "tropes": [
        "Evolution",
        "Social Control",
        "Surveillance"
      ],
      "filmingLocation": "Toronto, Ontario, Canada",
      "depictedLocation": "United States (various locations)",
      "id": 105,
      "color": "#313845",
      "director": "Bryan Singer",
      "blurb": "Mutants fight for acceptance as rising fear and surveillance threaten to divide humanity forever."
    },
    {
      "title": "Vanilla Sky",
      "year": 2001,
      "depicted": 2001,
      "tropes": [
        "Consciousness",
        "Transcendence",
        "Free Will",
        "Social Control"
      ],
      "filmingLocation": "New York City, USA",
      "depictedLocation": "New York City (dream/LC tech layers)",
      "id": 106,
      "color": "#8b847c",
      "director": "Cameron Crowe",
      "blurb": "A man trapped in layered dreams confronts memory, identity, and the cost of reshaping his own reality."
    },
    {
      "title": "A.I. Artificial Intelligence",
      "year": 2001,
      "depicted": 2142,
      "tropes": [
        "AI",
        "Robotics",
        "Consciousness",
        "Social Control"
      ],
      "filmingLocation": "Oregon, Washington, California (USA)",
      "depictedLocation": "Future flooded Earth (various regions)",
      "id": 107,
      "color": "#0a0b0b",
      "director": "Steven Spielberg",
      "blurb": "A robotic child embarks on a journey of selfhood in a future where AI blurs the boundary between love and programming."
    },
    {
      "title": "Minority Report",
      "year": 2002,
      "depicted": 2054,
      "tropes": [
        "Surveillance",
        "Social Control",
        "Free Will",
        "AI"
      ],
      "filmingLocation": "Washington, D.C. & Virginia (USA)",
      "depictedLocation": "Washington, D.C. (futuristic)",
      "id": 108,
      "color": "#282c30",
      "director": "Steven Spielberg",
      "blurb": "A precrime detective uncovers a conspiracy that forces him to question fate, freedom, and omnipresent surveillance."
    },
    {
      "title": "The Matrix Reloaded",
      "year": 2003,
      "depicted": 2199,
      "tropes": [
        "AI",
        "Consciousness",
        "Social Control"
      ],
      "filmingLocation": "Sydney & Alameda (USA freeway set)",
      "depictedLocation": "The Matrix + post-apocalyptic real Earth",
      "id": 109,
      "color": "#2e583a",
      "director": "The Wachowskis",
      "blurb": "Neo ventures deeper into the Matrix as new programs and old enemies blur the line between control and choice."
    },
    {
      "title": "I, Robot",
      "year": 2004,
      "depicted": 2035,
      "tropes": [
        "Robotics",
        "AI",
        "Surveillance",
        "Social Control"
      ],
      "filmingLocation": "Vancouver, British Columbia, Canada",
      "depictedLocation": "Chicago (futuristic)",
      "id": 110,
      "color": "#434b56",
      "director": "Alex Proyas",
      "blurb": "A detective distrusts the robots now integrated into society until a murder investigation reveals a larger threat."
    },
    {
      "title": "Primer",
      "year": 2004,
      "depicted": 2004,
      "tropes": [
        "Free Will",
        "Transcendence"
      ],
      "filmingLocation": "Dallas, Texas, USA",
      "depictedLocation": "Texas suburbs (USA)",
      "id": 111,
      "color": "#363731",
      "director": "Shane Carruth",
      "blurb": "Two engineers accidentally invent time travel and spiral into paranoia as branching timelines multiply."
    },
    {
      "title": "Stargate Atlantis",
      "year": 2004,
      "depicted": 2004,
      "tropes": [
        "Space"
      ],
      "filmingLocation": "Vancouver, British Columbia, Canada",
      "depictedLocation": "Pegasus Galaxy (Atlantis city-ship)",
      "id": 112,
      "color": "#284759",
      "director": "Various (Brad Turner, Martin Wood, etc.)",
      "blurb": "Explorers discover the lost city-ship Atlantis and embark on missions across the Pegasus Galaxy."
    },
    {
      "title": "Eternal Sunshine of the Spotless Mind",
      "year": 2004,
      "depicted": 2004,
      "tropes": [
        "Consciousness",
        "Free Will",
        "Social Control",
        "Surveillance"
      ],
      "filmingLocation": "New York City & New Jersey, USA",
      "depictedLocation": "New York/New Jersey",
      "id": 113,
      "color": "#88939c",
      "director": "Michel Gondry",
      "blurb": "Two lovers erase each other from memory, only to rediscover what their shared past truly meant."
    },
    {
      "title": "Star Wars: Episode III - Revenge of the Sith",
      "year": 2005,
      "depicted": 1000,
      "tropes": [
        "Space",
        "AI",
        "Robotics",
        "Evolution"
      ],
      "filmingLocation": "Fox Studios Australia; UK; Italy; Thailand",
      "depictedLocation": "A galaxy far, far away (Coruscant, Mustafar, etc.)",
      "id": 114,
      "color": "#472f27",
      "director": "George Lucas",
      "blurb": "A galactic war erupts as the Jedi fall and Anakin Skywalker is consumed by a dark, destiny-shaping path."
    },
    {
      "title": "The Hitchhiker's Guide to the Galaxy",
      "year": 2005,
      "depicted": 2005,
      "tropes": [
        "Space",
        "AI",
        "Consciousness"
      ],
      "filmingLocation": "UK (Shepperton Studios) & Namibia",
      "depictedLocation": "Earth \u2192 various galactic locations",
      "id": 115,
      "color": "#4d5759",
      "director": "Garth Jennings",
      "blurb": "A hapless Earthling is swept across the galaxy on a wildly absurd, philosophical adventure."
    },
    {
      "title": "War of the Worlds",
      "year": 2005,
      "depicted": 2005,
      "tropes": [
        "Free Will",
        "Social Control"
      ],
      "filmingLocation": "New York, New Jersey, Virginia (USA)",
      "depictedLocation": "United States (alien invasion)",
      "id": 116,
      "color": "#383533",
      "director": "Steven Spielberg",
      "blurb": "A father races to protect his children as alien tripods devastate the world with overwhelming force."
    },
    {
      "title": "Children of Men",
      "year": 2006,
      "depicted": 2027,
      "tropes": [
        "Social Control",
        "Surveillance",
        "Free Will"
      ],
      "filmingLocation": "London & various UK sites",
      "depictedLocation": "Dystopian United Kingdom",
      "id": 117,
      "color": "#3a382e",
      "director": "Alfonso Cuar\u00f3n",
      "blurb": "In a collapsing society, one man becomes the unlikely guardian of a pregnant refugee who may change the future."
    },
    {
      "title": "Sunshine",
      "year": 2007,
      "depicted": 2057,
      "tropes": [
        "Space",
        "Consciousness",
        "Free Will"
      ],
      "filmingLocation": "3 Mills Studios, London (UK)",
      "depictedLocation": "Interstellar spacecraft Icarus II (solar mission)",
      "id": 118,
      "color": "#e7224c",
      "director": "Danny Boyle",
      "blurb": "Astronauts voyage to rekindle the dying Sun, confronting cosmic terror and the fragility of human purpose."
    },
    {
      "title": "I Am Legend",
      "year": 2007,
      "depicted": 2012,
      "tropes": [
        "Evolution",
        "Free Will"
      ],
      "filmingLocation": "New York City, USA",
      "depictedLocation": "Post-apocalyptic Manhattan",
      "id": 119,
      "color": "#614a2f",
      "director": "Francis Lawrence",
      "blurb": "A lone survivor in a ravaged Manhattan searches for a cure while evading mutated, nocturnal hunters."
    },
    {
      "title": "Iron Man",
      "year": 2008,
      "depicted": 2008,
      "tropes": [
        "Robotics",
        "AI",
        "Free Will",
        "Social Control"
      ],
      "filmingLocation": "California (USA) + Nevada desert",
      "depictedLocation": "Malibu, California & Afghanistan",
      "id": 120,
      "color": "#272226",
      "director": "Jon Favreau",
      "blurb": "A captured weapons manufacturer builds a high-tech suit that transforms him into an armored hero."
    },
    {
      "title": "District 9",
      "year": 2009,
      "depicted": 2010,
      "tropes": [
        "Surveillance",
        "Free Will",
        "Evolution",
        "Social Control"
      ],
      "filmingLocation": "Johannesburg, South Africa",
      "depictedLocation": "Johannesburg (alien refugee zone)",
      "id": 121,
      "color": "#686764",
      "director": "Neill Blomkamp",
      "blurb": "An apartheid-style alien slum becomes ground zero for a man\u2019s transformation and political awakening."
    },
    {
      "title": "Moon",
      "year": 2009,
      "depicted": 2035,
      "tropes": [
        "AI",
        "Consciousness",
        "Social Control"
      ],
      "filmingLocation": "Shepperton Studios, England",
      "depictedLocation": "The Moon (lunar mining base)",
      "id": 122,
      "color": "#343637",
      "director": "Duncan Jones",
      "blurb": "A lunar worker uncovers the truth about his identity on a mining base controlled by a manipulative AI."
    },
    {
      "title": "Stargate Universe",
      "year": 2009,
      "depicted": 2009,
      "tropes": [
        "Space",
        "AI",
        "Consciousness"
      ],
      "filmingLocation": "Vancouver, British Columbia, Canada",
      "depictedLocation": "Ancient starship Destiny (deep space)",
      "id": 123,
      "color": "#545759",
      "director": "Various (Andy Mikita, Robert C. Cooper, etc.)",
      "blurb": "A stranded crew battles to survive aboard an ancient starship on an endless journey through deep space."
    },
    {
      "title": "Avatar",
      "year": 2009,
      "depicted": 2154,
      "tropes": [
        "Evolution",
        "Consciousness",
        "Transcendence",
        "Social Control"
      ],
      "filmingLocation": "Wellington (New Zealand), Los Angeles performance capture",
      "depictedLocation": "Pandora (extraterrestrial moon)",
      "id": 124,
      "color": "#252831",
      "director": "James Cameron",
      "blurb": "A paralyzed Marine inhabits an alien body on Pandora, discovering a world worth fighting for."
    },
    {
      "title": "Paprika",
      "year": 2006,
      "depicted": 2006,
      "tropes": [
        "Consciousness",
        "Surveillance",
        "Social Control",
        "Free Will"
      ],
      "filmingLocation": "Tokyo, Japan (animation production)",
      "depictedLocation": "Near-future Tokyo (dream landscapes)",
      "id": 125,
      "color": "#ab6f57",
      "director": "Satoshi Kon",
      "blurb": "A dream-invading device sparks chaos as delusions spill into reality in a surreal psychological thriller."
    },
    {
      "title": "Inception",
      "year": 2010,
      "depicted": 2010,
      "tropes": [
        "Consciousness",
        "Free Will",
        "Social Control",
        "Surveillance"
      ],
      "filmingLocation": "Tokyo, Paris, Los Angeles, London, Calgary",
      "depictedLocation": "Global modern Earth + shared dreamscapes",
      "id": 126,
      "color": "#315160",
      "director": "Christopher Nolan",
      "blurb": "A thief dives into layered shared dreams to implant an idea that could rewrite a man\u2019s life."
    },
    {
      "title": "Black Mirror",
      "year": 2011,
      "depicted": 2011,
      "tropes": [
        "Surveillance",
        "Social Control",
        "AI",
        "Consciousness"
      ],
      "filmingLocation": "United Kingdom (various)",
      "depictedLocation": "Near-future Earth (varies by episode)",
      "id": 127,
      "color": "#a0988b",
      "director": "Charlie Brooker (series creator); various directors",
      "blurb": "Anthology stories explore near-future dystopias shaped by invasive technology and fragile identity."
    },
    {
      "title": "Rise of the Planet of the Apes",
      "year": 2011,
      "depicted": 2016,
      "tropes": [
        "Evolution",
        "Consciousness",
        "Social Control"
      ],
      "filmingLocation": "Vancouver, Canada",
      "depictedLocation": "San Francisco, USA",
      "id": 128,
      "color": "#453e2f",
      "director": "Rupert Wyatt",
      "blurb": "A genetically enhanced ape leads an uprising as humanity faces the consequences of its own experiments."
    },
    {
      "title": "Rick and Morty",
      "year": 2013,
      "depicted": 2013,
      "tropes": [
        "Space",
        "Evolution",
        "Consciousness",
        "AI",
        "Free Will",
        "Transcendence",
        "Robotics"
      ],
      "filmingLocation": "Los Angeles (animation production)",
      "depictedLocation": "Multiverse (various planets/dimensions)",
      "id": 129,
      "color": "#4d684a",
      "director": "Justin Roiland & Dan Harmon (creators); various directors",
      "blurb": "A chaotic genius and his grandson wreak interdimensional havoc across universes and timelines."
    },
    {
      "title": "Europa Report",
      "year": 2013,
      "depicted": 2061,
      "tropes": [
        "Space",
        "Evolution",
        "Surveillance",
        "Consciousness"
      ],
      "filmingLocation": "New York City, USA",
      "depictedLocation": "Europa (moon of Jupiter)",
      "id": 130,
      "color": "#444e57",
      "director": "Sebasti\u00e1n Cordero",
      "blurb": "A Europa mission uncovers overwhelming evidence of alien life\u2014but only after tragic sacrifice."
    },
    {
      "title": "Oblivion",
      "year": 2013,
      "depicted": 2077,
      "tropes": [
        "AI",
        "Surveillance",
        "Consciousness",
        "Evolution"
      ],
      "filmingLocation": "Iceland, New York, Louisiana",
      "depictedLocation": "Post-apocalyptic Earth",
      "id": 131,
      "color": "#455768",
      "director": "Joseph Kosinski",
      "blurb": "A drone technician unearths a buried truth about Earth, identity, and the nature of the war he\u2019s fighting."
    },
    {
      "title": "Snowpiercer",
      "year": 2013,
      "depicted": 2031,
      "tropes": [
        "Social Control",
        "Surveillance",
        "Evolution"
      ],
      "filmingLocation": "Prague, Austria, South Korea",
      "depictedLocation": "Earth (global freezing catastrophe)",
      "id": 132,
      "color": "#9bacb4",
      "director": "Bong Joon-ho",
      "blurb": "The last survivors of humanity circle the frozen Earth aboard a rigidly stratified train locked in revolt."
    },
    {
      "title": "Gravity",
      "year": 2013,
      "depicted": 2013,
      "tropes": [
        "Space",
        "Consciousness",
        "Free Will"
      ],
      "filmingLocation": "Shepperton Studios, UK",
      "depictedLocation": "Low Earth Orbit (ISS, Shenzhou)",
      "id": 133,
      "color": "#2e3745",
      "director": "Alfonso Cuar\u00f3n",
      "blurb": "A stranded astronaut fights to survive in orbit after a disaster sends debris cascading through space."
    },
    {
      "title": "Edge of Tomorrow",
      "year": 2014,
      "depicted": 2015,
      "tropes": [
        "Evolution",
        "Free Will",
        "AI"
      ],
      "filmingLocation": "London, UK",
      "depictedLocation": "Future Western Europe",
      "id": 134,
      "color": "#6a5241",
      "director": "Doug Liman",
      "blurb": "A soldier trapped in a time loop battles evolving alien forces to change the outcome of a brutal war."
    },
    {
      "title": "Her",
      "year": 2014,
      "depicted": 2025,
      "tropes": [
        "AI",
        "Consciousness",
        "Free Will",
        "Social Control"
      ],
      "filmingLocation": "Los Angeles, USA & Shanghai",
      "depictedLocation": "Near-future Los Angeles",
      "id": 135,
      "color": "#a4313f",
      "director": "Spike Jonze",
      "blurb": "A lonely writer falls for an advanced operating system whose intelligence evolves far beyond human limits."
    },
    {
      "title": "Interstellar",
      "year": 2014,
      "depicted": 2067,
      "tropes": [
        "Space",
        "Evolution",
        "Consciousness",
        "Transcendence"
      ],
      "filmingLocation": "Iceland, Alberta, Los Angeles",
      "depictedLocation": "Earth \u2192 space \u2192 Gargantua system",
      "id": 136,
      "color": "#acb8be",
      "director": "Christopher Nolan",
      "blurb": "Explorers journey through wormholes to save humanity, encountering cosmic mysteries and nonlinear time."
    },
    {
      "title": "Transcendence",
      "year": 2014,
      "depicted": 2014,
      "tropes": [
        "AI",
        "Consciousness",
        "Surveillance",
        "Social Control",
        "Transcendence"
      ],
      "filmingLocation": "New Mexico, California",
      "depictedLocation": "United States (near-future scientific setting)",
      "id": 137,
      "color": "#656162",
      "director": "Wally Pfister",
      "blurb": "A dying scientist\u2019s mind transcends into digital form, raising profound questions about power and identity."
    },
    {
      "title": "The Avengers",
      "year": 2012,
      "depicted": 2012,
      "tropes": [
        "Robotics",
        "Surveillance",
        "Free Will",
        "Evolution",
        "Transcendence"
      ],
      "filmingLocation": "Cleveland, Albuquerque, New York City",
      "depictedLocation": "New York City",
      "id": 138,
      "color": "#3d4e52",
      "director": "Joss Whedon",
      "blurb": "Earth\u2019s mightiest heroes unite to repel an alien invasion threatening New York City."
    },
    {
      "title": "Captain America: The Winter Soldier",
      "year": 2014,
      "depicted": 2014,
      "tropes": [
        "Surveillance",
        "Social Control",
        "Evolution",
        "Transcendence"
      ],
      "filmingLocation": "Cleveland, Los Angeles, Washington D.C.",
      "depictedLocation": "Washington D.C.",
      "id": 139,
      "color": "#616761",
      "director": "Anthony Russo & Joe Russo",
      "blurb": "Captain America uncovers a conspiracy within S.H.I.E.L.D. as surveillance and control tighten around him."
    },
    {
      "title": "Mr. Robot",
      "year": 2015,
      "depicted": 2015,
      "tropes": [
        "Surveillance",
        "Social Control",
        "Free Will"
      ],
      "filmingLocation": "New York City",
      "depictedLocation": "New York City",
      "id": 140,
      "color": "#292629",
      "director": "Sam Esmail",
      "blurb": "A hacker rebels against an all-powerful conglomerate while grappling with fractured identity and paranoia."
    },
    {
      "title": "Chappie",
      "year": 2015,
      "depicted": 2016,
      "tropes": [
        "AI",
        "Robotics",
        "Consciousness"
      ],
      "filmingLocation": "Johannesburg, South Africa",
      "depictedLocation": "Johannesburg",
      "id": 141,
      "color": "#736a63",
      "director": "Neill Blomkamp",
      "blurb": "A police robot gains consciousness, forcing society to confront what it means to be alive."
    },
    {
      "title": "Ex Machina",
      "year": 2015,
      "depicted": 2014,
      "tropes": [
        "AI",
        "Consciousness",
        "Surveillance",
        "Free Will",
        "Robotics"
      ],
      "filmingLocation": "Norway & UK",
      "depictedLocation": "Remote mountain research residence",
      "id": 142,
      "color": "#322223",
      "director": "Alex Garland",
      "blurb": "A programmer evaluates an advanced android whose intelligence may surpass\u2014and manipulate\u2014its creator."
    },
    {
      "title": "The Martian",
      "year": 2015,
      "depicted": 2035,
      "tropes": [
        "Space",
        "Free Will"
      ],
      "filmingLocation": "Wadi Rum (Jordan), Budapest",
      "depictedLocation": "Mars",
      "id": 143,
      "color": "#66554e",
      "director": "Ridley Scott",
      "blurb": "An astronaut stranded on Mars uses ingenuity and optimism to survive against impossible odds."
    },
    {
      "title": "Arrival",
      "year": 2016,
      "depicted": 2016,
      "tropes": [
        "Consciousness",
        "Evolution",
        "Free Will",
        "Space"
      ],
      "filmingLocation": "Montreal & Quebec, Canada",
      "depictedLocation": "Montana + alien ship",
      "id": 144,
      "color": "#62584a",
      "director": "Denis Villeneuve",
      "blurb": "A linguist communicates with alien visitors whose language reshapes humanity\u2019s understanding of time."
    },
    {
      "title": "Blade Runner 2049",
      "year": 2017,
      "depicted": 2049,
      "tropes": [
        "AI",
        "Social Control"
      ],
      "filmingLocation": "Budapest, Hungary",
      "depictedLocation": "Los Angeles, 2049",
      "id": 145,
      "color": "#523d36",
      "director": "Denis Villeneuve",
      "blurb": "A new blade runner uncovers a dangerous secret that could alter the future of humans and replicants."
    },
    {
      "title": "Ready Player One",
      "year": 2018,
      "depicted": 2045,
      "tropes": [
        "Social Control",
        "Surveillance",
        "AI",
        "Consciousness"
      ],
      "filmingLocation": "Birmingham (UK), Ohio (USA)",
      "depictedLocation": "Columbus, Ohio + OASIS virtual universe",
      "id": 146,
      "color": "#716691",
      "director": "Steven Spielberg",
      "blurb": "A teenager escapes a bleak future through a virtual world where corporate power threatens freedom itself."
    },
    {
      "title": "Avengers: Endgame",
      "year": 2019,
      "depicted": 2023,
      "tropes": [
        "Evolution",
        "Space",
        "Consciousness",
        "Free Will",
        "Transcendence",
        "AI",
        "Robotics"
      ],
      "filmingLocation": "Atlanta, USA",
      "depictedLocation": "Earth + space (various locations)",
      "id": 147,
      "color": "#4f2e62",
      "director": "Anthony Russo & Joe Russo",
      "blurb": "Heroes face the aftermath of a cosmic catastrophe as time travel becomes their final hope."
    },
    {
      "title": "Avengers: Infinity War",
      "year": 2018,
      "depicted": 2018,
      "tropes": [
        "Evolution",
        "Space",
        "Consciousness",
        "Free Will",
        "Transcendence",
        "AI",
        "Robotics"
      ],
      "filmingLocation": "Atlanta, Edinburgh, New York (stand-in set)",
      "depictedLocation": "Earth + Titan + various galactic sites",
      "id": 148,
      "color": "#65393a",
      "director": "Anthony Russo & Joe Russo",
      "blurb": "A galactic war erupts as a tyrant seeks ultimate power across worlds and timelines."
    },
    {
      "title": "Star Wars: Episode IX - The Rise of Skywalker",
      "year": 2019,
      "depicted": 1000,
      "tropes": [
        "Space",
        "AI",
        "Robotics"
      ],
      "filmingLocation": "Jordan, England, Wadi Rum",
      "depictedLocation": "A galaxy far, far away",
      "id": 149,
      "color": "#616680",
      "director": "J.J. Abrams",
      "blurb": "The Skywalker saga concludes with a final clash between light and dark across the galaxy."
    },
    {
      "title": "Tenet",
      "year": 2020,
      "depicted": 2020,
      "tropes": [
        "Free Will",
        "Surveillance",
        "Social Control",
        "Consciousness"
      ],
      "filmingLocation": "Tallinn, Oslo, Mumbai, Italy, LA",
      "depictedLocation": "Global Earth",
      "id": 150,
      "color": "#677582",
      "director": "Christopher Nolan",
      "blurb": "An agent battles a temporal war where time itself runs backward, forcing him into paradox upon paradox."
    },
    {
      "title": "Dune: Part Two",
      "year": 2024,
      "depicted": 3000,
      "tropes": [
        "Transcendence",
        "Consciousness",
        "Free Will",
        "Social Control",
        "Space"
      ],
      "filmingLocation": "Budapest, Abu Dhabi, Jordan",
      "depictedLocation": "Arrakis",
      "id": 151,
      "color": "#973a0d",
      "director": "Denis Villeneuve",
      "blurb": "Paul Atreides leads a prophetic uprising on Arrakis as war, destiny, and cosmic forces collide."
    },
    {
      "title": "Jurassic World Dominion",
      "year": 2022,
      "depicted": 2022,
      "tropes": [
        "Evolution",
        "Consciousness",
        "Social Control"
      ],
      "filmingLocation": "British Columbia, Malta, UK",
      "depictedLocation": "Global Earth",
      "id": 152,
      "color": "#4b2f05",
      "director": "Colin Trevorrow",
      "blurb": "Humans and dinosaurs struggle to coexist as corporate schemes unleash chaos across the globe."
    },
    {
      "title": "Avatar: The Way of Water",
      "year": 2022,
      "depicted": 2154,
      "tropes": [
        "Evolution",
        "Consciousness",
        "Transcendence"
      ],
      "filmingLocation": "New Zealand & LA performance capture",
      "depictedLocation": "Pandora (extraterrestrial moon)",
      "id": 153,
      "color": "#46444d",
      "director": "James Cameron",
      "blurb": "Jake Sully\u2019s family seeks refuge with Pandora\u2019s ocean clans as old threats surge back to life."
    },
    {
      "title": "Ghostbusters: Afterlife",
      "year": 2021,
      "depicted": 2021,
      "tropes": [
        "Transcendence"
      ],
      "filmingLocation": "Alberta, Canada",
      "depictedLocation": "Small-town Oklahoma",
      "id": 154,
      "color": "#5a7770",
      "director": "Jason Reitman",
      "blurb": "A new generation uncovers spectral secrets in a small town haunted by the past."
    },
    {
      "title": "The Invisible Man",
      "year": 2020,
      "depicted": 2020,
      "tropes": [
        "Surveillance",
        "Social Control",
        "Free Will",
        "Consciousness"
      ],
      "filmingLocation": "Sydney, Australia",
      "depictedLocation": "California (fictional coastal town)",
      "id": 155,
      "color": "#504c4c",
      "director": "Leigh Whannell",
      "blurb": "A woman fights to expose her tormentor after he becomes invisible through cutting-edge surveillance tech."
    },
    {
      "title": "Don't Look Up",
      "year": 2021,
      "depicted": 2021,
      "tropes": [
        "Social Control",
        "Free Will"
      ],
      "filmingLocation": "Boston & Massachusetts (USA)",
      "depictedLocation": "United States + global",
      "id": 156,
      "color": "#dbc9ba",
      "director": "Adam McKay",
      "blurb": "Two scientists desperately try to warn the world about an incoming comet that no one wants to believe in."
    },
    {
      "title": "Nope",
      "year": 2022,
      "depicted": 2020,
      "tropes": [
        "Surveillance",
        "Consciousness",
        "Evolution/Genetic Engineering",
        "Free Will"
      ],
      "filmingLocation": "Santa Clarita Valley, California",
      "depictedLocation": "Agua Dulce, California",
      "id": 157,
      "color": "#0c1e38",
      "director": "Jordan Peele",
      "blurb": "An isolated California community confronts a predatory phenomenon that defies nature and human understanding."
    },
    {
      "title": "Everything Everywhere All at Once",
      "year": 2022,
      "depicted": 2022,
      "tropes": [
        "Consciousness",
        "Free Will",
        "Evolution/Genetic Engineering",
        "Transcendence"
      ],
      "filmingLocation": "Simi Valley & San Fernando Valley, California",
      "depictedLocation": "Multiverse (various timelines/universes)",
      "id": 158,
      "color": "#856465",
      "director": "Daniel Kwan & Daniel Scheinert",
      "blurb": "A laundromat owner is hurled across the multiverse and must embrace every version of herself to save existence."
    },
    {
      "title": "King of the Rocket Men",
      "year": 1949,
      "depicted": 1949,
      "tropes": [
        "Robotics",
        "AI",
        "Surveillance"
      ],
      "filmingLocation": "Republic Pictures Studios, Hollywood, California, USA",
      "depictedLocation": "United States (various urban/scientific sites)",
      "id": 159,
      "color": "#bd9761",
      "director": "Fred C. Brannon",
      "blurb": "A rocket-powered crimefighter battles a high-tech conspiracy threatening American cities."
    },
    {
      "title": "Krakatit",
      "year": 1948,
      "depicted": 1948,
      "tropes": [
        "Social Control",
        "Consciousness",
        "Free Will"
      ],
      "filmingLocation": "Barrandov Studios, Prague, Czechoslovakia",
      "depictedLocation": "Czechoslovakia (postwar scientific/industrial environments)",
      "id": 160,
      "color": "#744a36",
      "director": "Otakar V\u00e1vra",
      "blurb": "A scientist\u2019s dangerous invention spirals him into paranoia in a surreal tale of guilt and responsibility."
    },
    {
      "title": "The Jungle Captive",
      "year": 1945,
      "depicted": 1945,
      "tropes": [
        "Consciousness",
        "Evolution/Genetic Engineering",
        "Social Control"
      ],
      "filmingLocation": "Universal Studios, Hollywood, California, USA",
      "depictedLocation": "United States (laboratories + forests/jungle-like areas)",
      "id": 161,
      "color": "#675d49",
      "director": "Harold Young",
      "blurb": "A mad doctor resurrects a creature in a twisted experiment that blurs humanity and engineered evolution."
    },
    {
      "title": "Bloodshot",
      "year": 2020,
      "depicted": 2020,
      "tropes": [
        "AI",
        "Transcendence",
        "Consciousness",
        "Social Control",
        "Evolution/Genetic Engineering"
      ],
      "filmingLocation": "Cape Town, South Africa; Prague, Czech Republic",
      "depictedLocation": "Multiple urban locations (global, near-future setting)",
      "id": 162,
      "color": "#453039",
      "director": "Dave Wilson",
      "blurb": "A resurrected soldier discovers he\u2019s being remotely controlled as he fights to reclaim his identity."
    },
    {
      "title": "Spider-Man: No Way Home",
      "year": 2021,
      "depicted": 2021,
      "tropes": [
        "Evolution/Genetic Engineering",
        "Free Will",
        "Social Control"
      ],
      "filmingLocation": "Atlanta, Georgia; Los Angeles; New York City",
      "depictedLocation": "New York City + multiverse crossover settings",
      "id": 163,
      "color": "#7d6468",
      "director": "Jon Watts",
      "blurb": "Peter Parker faces villains from alternate universes while reckoning with the consequences of magic gone wrong."
    },
    {
      "title": "Deadpool & Wolverine",
      "year": 2024,
      "depicted": 2024,
      "tropes": [
        "Evolution/Genetic Engineering",
        "Free Will"
      ],
      "filmingLocation": "London, UK; Buckinghamshire; Pinewood Studios",
      "depictedLocation": "Multiple timelines/universes (Marvel multiverse)",
      "id": 164,
      "color": "#734f39",
      "director": "Shawn Levy",
      "blurb": "Deadpool teams up with Wolverine on a violent multiverse-spanning mission of chaos and redemption."
    },
    {
      "title": "Black Widow",
      "year": 2021,
      "depicted": 2016,
      "tropes": [
        "Social Control",
        "Surveillance",
        "Free Will"
      ],
      "filmingLocation": "??",
      "depictedLocation": "??",
      "id": 165,
      "color": "#7e5c59",
      "director": "Cate Shortland",
      "blurb": "Black Widow confronts her past and the sinister program that shaped her into a perfect operative."
    },
    {
      "title": "The Matrix Resurrections",
      "year": 2021,
      "depicted": 2200,
      "tropes": [
        "AI",
        "Consciousness",
        "Free Will",
        "Social Control",
        "Transcendence"
      ],
      "filmingLocation": "??",
      "depictedLocation": "??",
      "id": 166,
      "color": "#738987",
      "director": "Lana Wachowski",
      "blurb": "Neo is drawn back into a reprogrammed Matrix where memory, identity, and liberation intertwine once more."
    },
    {
      "title": "Spiderman: Across the Spiderverse",
      "year": 2023,
      "depicted": 2023,
      "tropes": [
        "Free Will",
        "Evolution/Genetic Engineering"
      ],
      "filmingLocation": "??",
      "depictedLocation": "??",
      "id": 167,
      "color": "#814545",
      "director": "Joaquim Dos Santos, Kemp Powers, Justin K. Thompson",
      "blurb": "Miles Morales races across universes to challenge a rigid multiversal destiny that claims he must fail."
    },
    {
      "title": "Furiosa: A Mad Max Saga",
      "year": 2024,
      "depicted": 2030,
      "tropes": [
        "Social Control",
        "Surveillance",
        "Free Will"
      ],
      "filmingLocation": "??",
      "depictedLocation": "??",
      "id": 168,
      "color": "#7b5c3d",
      "director": "George Miller",
      "blurb": "Furiosa survives a brutal wasteland to rise against a tyrant who rules through fear and scarcity."
    },
    {
      "title": "Looper",
      "year": 2012,
      "depicted": 2044,
      "tropes": [
        "Evolution/Genetic Engineering",
        "Free Will",
        "Social Control",
        "Surveillance"
      ],
      "filmingLocation": "??",
      "depictedLocation": "??",
      "id": 169,
      "color": "#c2b9b1",
      "director": "Rian Johnson",
      "blurb": "A contract killer confronts his future self in a world where time-travel is a weapon of crime syndicates."
    },
    {
      "title": "10 Cloverfield Lane",
      "year": 2016,
      "depicted": 2016,
      "tropes": [
        "Social Control",
        "Surveillance",
        "Consciousness"
      ],
      "filmingLocation": "??",
      "depictedLocation": "??",
      "id": 170,
      "color": "#1c221f",
      "director": "Dan Trachtenberg",
      "blurb": "A woman awakens in a bunker where her captor insists the outside world has ended, forcing her to question everything."
    }
  ]
  
  
data.sort((a, b) => a.year - b.year);

export default data