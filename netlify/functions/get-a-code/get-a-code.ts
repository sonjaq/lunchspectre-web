import { Handler } from '@netlify/functions'
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const { API_KEY, SUPABASE_URL } = process.env;
const NETLIFY_DEV = process.env.NETLIFY_DEV || 'false';
const supabase: SupabaseClient = createClient(SUPABASE_URL, API_KEY)
const albums = [
  "Prismatic",
  "Coefficient"
]


const getCodeCard: any = (code, album) => {
  let cover = '/assets/images/lslogo.jpg';
  if (album === 'Coefficient') {
    cover = '/assets/images/cover.jpg'
  } else if ( album === 'Prismatic' ) {
    cover ='/assets/images/prismatic-cover.jpg'
  }
  return `
  <div class="mt-4 card">
    <div class="card-image">
      <figure class="image is-square">
        <img src="${cover}" alt="${album} artwork">
      </figure>
    </div>
    <div class="card-content">
      <div class="media">
        <div class="media-content">
          <p class="title is-4">${album}</p>
          <p class="mt-4 subtitle is-6">${code}${NETLIFY_DEV === 'true' ? " DEV" : ""}</p>
          Click to redeem and download instantly!
          <a
          id="redeem-code"
          href="https://lunchspectre.bandcamp.com/yum?code=${NETLIFY_DEV !== 'true' ? code : ""}"
          target="_blank"
          class="button is-black is-fullwidth mt-4">
          Bandcamp</a>.
        </div>
      </div>
    </div>
  </div>
  `
}

function noCodesFound(errCode: number = 200) {
  return {
    statusCode: errCode,
    body: JSON.stringify({
      message: 'No codes available',
      html: ` <div class="mt-4 card">
      <div class="card-content">
        <div class="media">
          <div class="media-content">
            BOOOOO! There are no codes available or something broke. Please check back later or reach out to Lunch Spectre on <a href="https://instagram.com/lunchspectre">Instagram</a> or via <a href="mailto:lunchspectre@gmail.com?subject=Website Codes">email</a>.
          </div>
        </div>
      </div>
    </div>`
    })
  }
}

export const handler: Handler = async (event, context) => {
  let album = event.queryStringParameters?.album ? event.queryStringParameters.album : "Prismatic";
  console.log(album);
  if (!albums.includes(album)) {
    return noCodesFound(400);
  }
  try {
    const req = await supabase
      .from('code')
      .select('code, album')
      .eq('album', album)
      .eq('available', true);
    const data = req.data;
    console.log(req,data, req.error?.message);
    if (data?.length === 0) {
      console.error('No codes available');
      return noCodesFound(req.status);
    }
    if (data?.length > 0) {
      const { code, album } = data[0];

      // Allow testing without burning a code
      if (NETLIFY_DEV !== 'true') {
        await supabase
          .from('code')
          .update({
            available: false
          })
          .match({ code });
      }
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Your code for ${album}: ${code}`,
          code: code,
          album: album,
          html: getCodeCard(code, album)
        }),
      }
    }
    else {
      return noCodesFound(419);
    }
  } catch (error) {
    console.error(error.message, error.stack);
    return noCodesFound(500);
  }
}

