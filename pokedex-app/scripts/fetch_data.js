
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GRAPHQL_ENDPOINT = 'https://beta.pokeapi.co/graphql/v1beta';

const QUERY = `
  query {
    pokemon_v2_pokemon(limit: 1025, order_by: {id: asc}, where: {is_default: {_eq: true}}) {
      id
      name
      pokemon_v2_pokemontypes {
        pokemon_v2_type {
          name
        }
      }
    }
  }
`;

const REGIONS = [
  { name: 'Kanto', start: 1, end: 151 },
  { name: 'Johto', start: 152, end: 251 },
  { name: 'Hoenn', start: 252, end: 386 },
  { name: 'Sinnoh', start: 387, end: 493 },
  { name: 'Unova', start: 494, end: 649 },
  { name: 'Kalos', start: 650, end: 721 },
  { name: 'Alola', start: 722, end: 809 },
  { name: 'Galar', start: 810, end: 905 },
  { name: 'Paldea', start: 906, end: 1025 },
];

function getRegion(id) {
  const region = REGIONS.find(r => id >= r.start && id <= r.end);
  return region ? region.name : 'Unknown';
}

async function fetchData() {
  console.log('Fetching data from PokeAPI...');
  try {
    const response = await axios.post(GRAPHQL_ENDPOINT, { query: QUERY });
    const data = response.data.data.pokemon_v2_pokemon;

    const pokemonList = data.map(p => ({
      id: p.id,
      name: p.name,
      types: p.pokemon_v2_pokemontypes.map(t => t.pokemon_v2_type.name),
      region: getRegion(p.id),
      sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
    }));

    const outputPath = path.join(__dirname, '../src/data/pokedex.json');
    fs.writeFileSync(outputPath, JSON.stringify(pokemonList, null, 2));
    console.log(`Saved ${pokemonList.length} Pokemon to ${outputPath}`);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

fetchData();
