# BingeBook

BingeBook is a swipe-based book discovery app that matches readers with books based on taste, mood, and reading habits.

## Features

- Taste quiz onboarding
- Personalized book deck
- Swipe-based discovery
- Book detail pages
- Reading list
- Profile with reading stats
- Light and dark theme
- Supabase authentication
- Netlify web deployment

## Tech Stack

- Expo
- React Native
- Expo Router
- Supabase
- Netlify

## Local Development

```bash
npm install
npm run web
```

## Web Build

```bash
npm run build:web
```

The static web build is exported to:

```txt
dist
```

## Environment Variables

Create a `.env` file:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Netlify Deployment

Build command:

```bash
npm run build:web
```

Publish directory:

```txt
dist
```
