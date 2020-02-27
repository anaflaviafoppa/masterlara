/*window.addEventListener('load', () => {
  console.log('Ironmaker app started successfully!');
}, false);*/


function modifyImage() {
  var img1 = "https://res.cloudinary.com/ddz8awd1y/image/upload/v1582735089/LIke/like_bzch3o.png";
  var img2 = "https://res.cloudinary.com/ddz8awd1y/image/upload/v1582735090/LIke/dislike_v9or0v.png";

  var imgElement = (document.getElementById("imageLike"));

  imgElement.src = (imgElement.src === img1)? img2 :img1;
  
}

