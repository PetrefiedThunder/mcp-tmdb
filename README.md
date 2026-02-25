# mcp-tmdb

Search movies, TV shows, actors, get trending content and credits via TMDB.

## Tools

| Tool | Description |
|------|-------------|
| `search_movies` | Search for movies. |
| `get_movie` | Get movie details. |
| `search_tv` | Search for TV shows. |
| `get_trending` | Get trending movies or TV shows. |
| `get_credits` | Get cast and crew for a movie. |
| `search_person` | Search for actors/directors. |

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `TMDB_API_KEY` | Yes | TMDB API key (free at themoviedb.org) |

## Installation

```bash
git clone https://github.com/PetrefiedThunder/mcp-tmdb.git
cd mcp-tmdb
npm install
npm run build
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tmdb": {
      "command": "node",
      "args": ["/path/to/mcp-tmdb/dist/index.js"],
      "env": {
        "TMDB_API_KEY": "your-tmdb-api-key"
      }
    }
  }
}
```

## Usage with npx

```bash
npx mcp-tmdb
```

## License

MIT
