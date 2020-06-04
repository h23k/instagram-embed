import style from './style.scss';

const apiUrl = 'https://graph.facebook.com/v7.0/';
const igUserId = '10000000000000000';
const accessToken = '';
let apiUrlNext = '';
let recentSearch = '';
let recentQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  _getAccountInfo();
  _getMyMeida();
});

const input = document.querySelector('.hashtag-search input');
const button = document.querySelector('.hashtag-search button');

input.addEventListener('keypress', (e) => {
  if (e.keyCode === 13) {
    button.click();
  }
});

button.addEventListener('click', () => {
  const container = document.querySelector('.search-container');
  const inputValue = input.value.trim();
  const isHashtag = inputValue.indexOf('#');
  const isAccount = inputValue.indexOf('@');
  const queryString = inputValue.replace(/^[#@]/, '');

  if (queryString) {
    _startSearch();
    if (recentSearch + recentQuery !== inputValue) {
      apiUrlNext = '';
    }
    if (isHashtag === 0) {
      recentSearch = '#';
      if (apiUrlNext === '') {
        _searchHashTag(container, queryString);
      } else {
        _getHashTagMedia(container, '', apiUrlNext);
      }
    }
    if (isAccount === 0) {
      recentSearch = '@';
      _getBusinessMedia(container, queryString, apiUrlNext);
    }
  }
});

function _getAccountInfo() {
  // Get the Instagram Business Account's
  const api = `${apiUrl}${igUserId}?fields=ig_id,username,media_count,followers_count,follows_count&access_token=${accessToken}`;

  fetch(api)
    .then(response => {
      return response.json();
    })
    .then(data => {
      // console.log(data);
      const userName = document.querySelector('.account-info .user-name');
      const medias = document.querySelector('.account-info .media-count .num');
      const followers = document.querySelector('.account-info .followers-count .num');
      const follows = document.querySelector('.account-info .follows-count .num');

      userName.textContent = data.username;
      medias.textContent = data.media_count;
      followers.textContent = data.followers_count;
      follows.textContent = data.follows_count;
    });
}

function _getMyMeida(url = '') {
  const container = document.querySelector('.media-container');
  // Get the Instagram Business Account's Media Objects
  const api = url || `${apiUrl}${igUserId}/media?fields=caption,children,comments_count,id,like_count,media_type,media_url,thumbnail_url&access_token=${accessToken}`;

  // console.log(api);
  fetch(api)
    .then(response => {
      return response.json();
    })
    .then(data => {
      // console.log(data, data.data, data.error);
      if (data.data !== undefined) {
        _createTile(container, data.data, (url === '') ? true : false);

        // console.log(data.paging);
        if (data.paging !== undefined && data.paging.next !== undefined) {
          _getMyMeida(data.paging.next);
        }
      }
    })
    .catch(error => {
      console.log(error);
    });
}

function _createTile(container, media, insert) {
  const fragment = document.createDocumentFragment();

  media.forEach((item, i) => {
    const tile = document.createElement('div')
    tile.classList.add('tile');

    const figure = document.createElement('figure');
    tile.appendChild(figure);

    switch (item.media_type) {
      case 'IMAGE':
      case 'CAROUSEL_ALBUM':
        const img = document.createElement('img');
        const imgSrc = item.thumbnail_url || item.media_url;
        img.src = imgSrc;
        figure.appendChild(img);
        break;
      case 'VIDEO':
        const video = document.createElement('video');
        const source = document.createElement('source');
        source.src = item.media_url;
        video.appendChild(source);
        figure.appendChild(video);
        break;
      // case 'CAROUSEL_ALBUM':
      //   if (item.children !== undefined) {
      //     console.log(item);
      //     const n = Math.floor(Math.random() * item.children.data.length);
      //     _getCarouselMedia(item.children.data[n].id);
      //   }
      //   return;
      default:
        console.log(item.media_type);
        break;
    }

    const caption = document.createElement('figcaption');
    caption.textContent = item.caption;
    figure.appendChild(caption);

    fragment.appendChild(tile);
  });

  if (insert) {
    container.insertBefore(fragment, null);
  } else {
    container.appendChild(fragment);
  }
}

function _getBusinessMedia(container, userName, url = '') {
  const api = url || `${apiUrl}${igUserId}?fields=business_discovery.username(${encodeURI(userName)}){followers_count,follows_count,media_count,media{caption,children,comments_count,id,like_count,media_type,media_url,username}}&access_token=${accessToken}`;

  // console.log(api);
  fetch(api)
    .then(response => {
      return response.json();
    })
    .then(data => {
      // console.log(data);
      _checkApiError(data);
      if (data.business_discovery !== undefined && data.business_discovery.media !== undefined) {
        recentQuery = userName;
        _createTile(container, data.business_discovery.media.data, false);
        _stopSearch();

        if (data.business_discovery.media.paging !== undefined && data.business_discovery.media.paging.cursors.after !== undefined) {
          apiUrlNext = `${apiUrl}${igUserId}?fields=business_discovery.username(${userName}){followers_count,follows_count,media_count,media.after(${data.business_discovery.media.paging.cursors.after}){caption,children,comments_count,id,like_count,media_type,media_url,username}}&access_token=${accessToken}`;
        } else {
          apiUrlNext = '';
        }
      }
    })
    .catch(error => {
      console.log(error);
    });
}

function _searchHashTag(container, query) {
  const api = `${apiUrl}ig_hashtag_search?q=${encodeURI(query)}&user_id=${igUserId}&access_token=${accessToken}`;

  // console.log(api);
  fetch(api)
    .then(response => {
      return response.json();
    })
    .then(data => {
      // console.log(data);
      _checkApiError(data);
      if (data.data !== undefined) {
        recentQuery = query;
        const ids = data.data;
        ids.forEach((item, i) => {
          _getHashTagMedia(container, item.id);
        });
      }
    })
    .catch(error => {
      console.log(error);
    });
}

function _getHashTagMedia(container, hashId, url = '') {
  const api = url || `${apiUrl}${hashId}/recent_media?user_id=${igUserId}&fields=caption,children,comments_count,id,like_count,media_type,media_url&access_token=${accessToken}`;

  // console.log(api);
  fetch(api)
    .then(response => {
      return response.json();
    })
    .then(data => {
      // console.log(data);
      _checkApiError(data);
      if (data.data !== undefined) {
        if (data.data.length !== 0) {
          _createTile(container, data.data, false);
          _stopSearch();
        } else {
          _stopSearch();
          _showMessage('データがありません。');
        }
      }

      // console.log(data.paging);
      if (data.paging !== undefined && data.paging.next !== undefined) {
        apiUrlNext = data.paging.next;
      } else {
        apiUrlNext = '';
      }
    })
    .catch(error => {
      console.log(error);
    });
}

function _getCarouselMedia(mediaId) {
  const api = `${apiUrl}${mediaId}?fields=id,media_type,media_url,thumbnail_url&access_token=${accessToken}`;

  // console.log(api);
  fetch(api)
    .then(response => {
      return response.json();
    })
    .then(data => {
      // console.log('_getCarouselMedia', data);
      return data.thumbnail_url || data.media_url;
    });
}

function _checkApiError(data) {
  if (data.error) {
    const message = data.error.error_user_msg || data.error.message;
    _stopSearch();
    _showMessage(message);
    throw new Error(data.error.code + ': ' + message);
  }
}

function _startSearch() {
  const loading = document.querySelector('.loading');
  loading.classList.add('loading--show');
}
function _stopSearch() {
  const loading = document.querySelector('.loading');
  loading.classList.remove('loading--show');
}

function _showMessage(message) {
  const messageBox = document.querySelector('.message-box');
  messageBox.innerHTML = '<p>' + message + '</p>';
  messageBox.classList.add('message-box--show');
  setTimeout(() => {
    const messageBox = document.querySelector('.message-box');
    messageBox.classList.remove('message-box--show');
  }, 3000);
}
