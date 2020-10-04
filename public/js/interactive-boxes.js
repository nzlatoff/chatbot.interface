function createInteractiveBox(client, dots=false) {
  // console.log('creating box, client:', client);
  // check if there isn't a div already
  if (!$(`#${client.id}`).length) {
    // console.log('creating element', client.id, 'for user', client.user);
    let div = document.createElement("div");
    div.id = client.id;
    div.className = 'talkco';
    if (!dots) {
      div.innerHTML = `<em>${client.user}:</em> (...)`;
    } else {
      div.innerHTML = `(...)`;
    }
    document.querySelector('#interactive-box').appendChild(div);
  } else {
    // console.log('found element', $(`#${client.id}`));
  }
};

function removeUnusedBoxes(target, data, autoScroll=null) {
  // console.log('removing boxes', data);
  $(target).each((index, el) => {
    // console.log('while removing, el:', el.id);
    if (!(el.id in data)) {
      // console.log('removing box', el.id);
      el.remove();
      if (autoScroll) delete autoScroll[el.id];
    }
  });
  return autoScroll;
};

function clearUser(data, autoScroll) {
  $(`#${data.id}`).remove();
  delete autoScroll[data.id];
  return autoScroll;
}

export { createInteractiveBox, removeUnusedBoxes, clearUser };
