import { Handler } from '@netlify/functions'
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const { API_KEY, SUPABASE_URL } = process.env;
const supabase: SupabaseClient = createClient(SUPABASE_URL, API_KEY);

const getCodeCard: any = (code, album) => {
  let cover = '/assets/images/lslogo.jpg';
  if (album === 'Coefficient') {
    cover = '/assets/images/cover.jpg'
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
          <p class="mt-4 subtitle is-6">${code}</p>
          Click to redeem and download instantly <a href="https://lunchspectre.bandcamp.com/yum?code=${code}" target="_blank">Bandcamp</a>.
        </div>
      </div>
    </div>
  </div>
  `
}

export const handler: Handler = async (event, context) => {

  try {
    const { data } = await supabase
      .from('code')
      .select('code, album')
      .eq('available', true)
      .order('album', { ascending: true }); // Gets all codes, Coefficient first

    if (data?.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No codes available',
          html: ` <div class="mt-4 card">
          <div class="card-content">
            <div class="media">
              <div class="media-content">
                I'm sorry, there are no codes available. Please check back later.
              </div>
            </div>
          </div>
        </div>`
        })
      }
    }
    if (data?.length > 0) {
      const { code, album } = data[0];
    
      await supabase
        .from('code')
        .update({
          available: false
        })
        .match({ code });
      
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
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No codes available'
        })
      }
    }
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Something went wrong`,
      }),
    }
  }
}

