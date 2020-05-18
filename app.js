import style from './style.scss';

const apiUrl = 'https://graph.facebook.com/v7.0/';
const igUserId = '10000000000000000';
const accessToken = '';

document.addEventListener('DOMContentLoaded', () => {
  _getMyMeida();
});

function _getMyMeida(url = '') {
  // Get the Instagram Business Account's Media Objects
  const api = url || `${apiUrl}${igUserId}/media?fields=caption,children,comments_count,id,like_count,media_type,media_url,thumbnail_url&access_token=${accessToken}`;

  fetch(api)
    .then(response => {
      return response.json();
    })
    .then(data => {
      if (data.data !== undefined) {
        _createTile(data.data, (url === '') ? true : false);

        if (data.paging !== undefined && data.paging.next !== undefined) {
          _getMyMeida(data.paging.next);
        }
      }
    })
    .catch(error => {
      console.log(error);
    });
}

function _createTile(media, insert) {
  const container = document.querySelector('.container');
  const fragment = document.createDocumentFragment();

  media.forEach((item, i) => {
    const tile = document.createElement('div')
    tile.classList.add('tile');

    const figure = document.createElement('figure');
    const img = document.createElement('img');
    img.src = item.thumbnail_url || item.media_url;
    figure.appendChild(img);

    const caption = document.createElement('figcaption');
    caption.textContent = item.caption;
    figure.appendChild(caption);
    tile.appendChild(figure);

    fragment.appendChild(tile);
  });

  if (insert) {
    container.insertBefore(fragment, null);
  } else {
    container.appendChild(fragment);
  }
}
