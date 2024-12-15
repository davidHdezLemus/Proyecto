// Constantes
const songList = document.querySelector('.main-content');
const scrollY = document.querySelector('.scrollY');
const currentMusic = document.querySelector('.currentMusic');
const playButton = document.querySelector('.play-button');
const pauseTopButton = document.querySelector('.user-controls button');
const progressBar = document.querySelector('.progress-bar');
const currentTime = document.querySelector('.time.current');
const totalTime = document.querySelector('.time.total');
const volumeBar = document.querySelector('.volume-bar');
const volumeBarFill = document.querySelector('.volume-bar-fill');
const volumeIcons = document.querySelectorAll('.volume-controls i');
const addButton = document.querySelector('.add-button');
const modal = document.getElementById("addMusicModal");
const btn = document.getElementById("add-button");
const cancelBtn = document.getElementById("boton-close");
const addMusicForm = document.getElementById("addMusicForm");
const nextButton = document.querySelector('.next-button');
const prevButton = document.querySelector('.prev-button');
const randomButton = document.querySelector('.random-button');
const loopButton = document.querySelector('.loop-button');
const filterLinks = document.querySelectorAll('.filtros-list li');
const controlButtons = document.querySelectorAll('.control-button');
const colorPrimaryIcons = document.querySelectorAll('.colorPrimary');

// Define la URL de la API para obtener las canciones.
const songsAPI = 'http://informatica.iesalbarregas.com:7008/songs';

// Define las opciones para la solicitud fetch (en este caso, solo GET).
const optionsGET = { method: 'GET' };

let currentSong = null; // Almacena la canción que se está reproduciendo actualmente.
let currentAudio = null; // Almacena el objeto Audio para la canción actual.
let isPlaying = false; // Indica si la música se está reproduciendo o no.
let volume = 0.5; // Almacena el nivel de volumen actual.
let isLooping = false; // Indica si la reproducción en bucle está activada.
let isRandomMode = false; // Indica si el modo de reproducción aleatoria está activado.
let allSongsList = []; // Almacena la lista completa de canciones.

// Obtiene la lista de canciones desde la API.
fetch(songsAPI, optionsGET)
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      return Promise.reject(`Network error: ${response.status}`);
    }
  })
  .then(songs => {
    processSongs(songs); // Llama a la función común para procesar las canciones
    setupControlEvents(songs);
    document.querySelectorAll('.filtros-list li')[0].classList.add('active');
  })
  .catch(error => {
    console.error('Error al obtener canciones:', error);
    if (scrollY) {
      scrollY.innerHTML = `<div style="color: red;">Error al cargar canciones: ${error}</div>`;
    }
  });

// Función para configurar los eventos de los controles de reproducción.
function setupControlEvents(songs) {
  // Agrega un event listener a los botones de play/pause para alternar la reproducción.
  playButton.addEventListener('click', handlePlayPause);
  pauseTopButton.addEventListener('click', handlePlayPause)

  function handlePlayPause() {
    if (currentSong) {
      togglePlayPause();
    }
  }

  // Agrega event listeners para los botones de siguiente, anterior, aleatorio y bucle.
  nextButton.addEventListener('click', playNextSong);
  prevButton.addEventListener('click', playPreviousSong);
  randomButton.addEventListener('click', toggleRandomMode);
  loopButton.addEventListener('click', toggleLoopMode);

  // Agrega event listeners a los elementos de la lista de filtros.
  document.querySelectorAll('.filtros-list li').forEach((link, index) => {
    link.addEventListener('click', (e) => {
      // Elimina la clase 'active' de todos los elementos de la lista.
      document.querySelectorAll('.filtros-list li').forEach(l => l.classList.remove('active'));
      // Agrega la clase 'active' al elemento seleccionado.
      link.classList.add('active');
      // Actualiza la lista de canciones filtradas.
      updateFilteredSongList();
    });
  });
}

function getSongsList() {
  // Obtiene el elemento de la lista de filtros que corresponde a "Canciones favoritas".
  const favoriteSongsLink = filterLinks[1];
  // Inicializa la lista de canciones con la lista completa.
  let songsList = allSongsList;

  // Si el filtro de "Canciones favoritas" está activo, usa la lista de favoritos del localStorage.
  if (favoriteSongsLink.classList.contains('active')) {
    songsList = JSON.parse(localStorage.getItem('favoriteSongs') || '[]');
  }

  return songsList;
}

// Función para reproducir la siguiente canción.
function playNextSong() {
  // Obtiene la lista de canciones a utilizar (todas o favoritas).
  const songsList = getSongsList();

  // Si la lista de canciones está vacía, no hace nada.
  if (!songsList.length) return;

  let nextIndex;
  if (isRandomMode) {
    // Si el modo aleatorio está activo, elige un índice aleatorio.
    nextIndex = Math.floor(Math.random() * songsList.length);
  } else {
    // Si no, calcula el índice de la siguiente canción en la lista.
    const currentIndex = songsList.findIndex(song => song.id === currentSong.id);
    nextIndex = (currentIndex + 1) % songsList.length;
  }

  // Obtiene la siguiente canción de la lista.
  const nextSong = songsList[nextIndex];

  // Reproduce la canción.
  playSong(nextSong);
}

function playPreviousSong() {
  // Obtiene la lista de canciones a utilizar (todas o favoritas).
  const songsList = getSongsList();

  // Si la lista de canciones está vacía, no hace nada.
  if (!songsList.length) return;

  let prevIndex;
  if (isRandomMode) {
    // Si el modo aleatorio está activo, elige un índice aleatorio.
    prevIndex = Math.floor(Math.random() * songsList.length);
  } else {
    // Si no, calcula el índice de la canción anterior en la lista.
    const currentIndex = songsList.findIndex(song => song.id === currentSong.id);
    prevIndex = (currentIndex - 1 + songsList.length) % songsList.length;
  }

  // Obtiene la canción anterior de la lista.
  const prevSong = songsList[prevIndex];

  // Reproduce la canción anterior.
  playSong(prevSong);
}

function toggleRandomMode() {
  // Alterna el estado del modo aleatorio.
  isRandomMode = !isRandomMode;

  // Actualiza la clase 'active' del botón para reflejar el estado del modo aleatorio.
  randomButton.classList.toggle('active', isRandomMode);
}

function toggleLoopMode() {
  // Alterna el estado de la reproducción en bucle.
  isLooping = !isLooping;

  // Actualiza la clase 'active' del botón para reflejar el estado de la reproducción en bucle.
  loopButton.classList.toggle('active', isLooping);
}

// Función que se ejecuta cuando la canción actual termina de reproducirse.
function handleSongEnd() {
  if (isLooping) {
    // Si el modo de repetición está activado, reinicia la canción actual.
    currentAudio.currentTime = 0;
    currentAudio.play();
  } else {
    // Si no, reproduce la siguiente canción en la lista.
    playNextSong();
  }
}

// Función para crear un elemento HTML que representa una canción en la lista.
function createSongItem(song) {
  // Crea un nuevo elemento div para la canción.
  const songItem = document.createElement('div');
  songItem.classList.add('song-item');

  // Almacena los datos de la canción como un JSON
  songItem.dataset.songData = JSON.stringify(song);

  // Crea un nuevo elemento div para el icono de reproducción.
  const playIconDiv = document.createElement('div');
  playIconDiv.classList.add('play-icon');

  // Crea un elemento box-icon para el icono de reproducción.
  const playIcon = document.createElement('box-icon');
  playIcon.setAttribute('name', 'play');
  playIcon.setAttribute('color', '#ffffff');

  // Agrega el icono de Boxicons al div.
  playIconDiv.appendChild(playIcon);

  // Crea elementos span para el título, artista y duración de la canción.
  const titleSpan = document.createElement('span');
  titleSpan.classList.add('title');
  titleSpan.textContent = song.title;

  const artistSpan = document.createElement('span');
  artistSpan.classList.add('artist');
  artistSpan.textContent = song.artist;

  const durationSpan = document.createElement('span');
  durationSpan.classList.add('duration');

  // Crea un objeto Audio para obtener la duración de la canción.
  const audio = new Audio(song.filepath);

  audio.addEventListener('loadedmetadata', () => {
    // Cuando los metadatos del audio se cargan, formatea la duración y la establece en el span.
    durationSpan.textContent = formatTime(audio.duration);
  });

  // Crea un elemento span para el icono de favorito.
  const favSpan = document.createElement('span');
  favSpan.classList.add('favorite-icon');

  // Crea un elemento box-icon para el icono de favorito.
  const fav = document.createElement('box-icon');
  fav.setAttribute('name', 'heart');
  fav.setAttribute('color', '#1db954');

  // Obtiene la lista de canciones favoritas del localStorage.
  const favoriteSongs = JSON.parse(localStorage.getItem('favoriteSongs') || '[]');

  // Verifica si la canción actual está en la lista de favoritos.
  const isFavorite = isSongFavorite(song, favoriteSongs);

  function isSongFavorite(song, favoriteSongs) {
    // Itera sobre la lista de canciones favoritas.
    for (let i = 0; i < favoriteSongs.length; i++) {
      // Si el ID de la canción coincide con el ID de una canción favorita, retorna true.
      if (favoriteSongs[i].id === song.id) {
        return true;
      }
    }
    // Si no se encontró la canción en la lista de favoritos, retorna false.
    return false;
  }

  // Almacena el estado de favorito en el dataset del elemento.
  songItem.dataset.isFavorite = isFavorite.toString();

  if (isFavorite) {
    // Si la canción es favorita, establece el tipo de icono como 'solid'.
    fav.setAttribute('type', 'solid');
  }

  // Agrega un event listener al icono de favorito para alternar el estado de favorito.
  fav.addEventListener('click', (e) => {

    // Obtiene la lista de canciones favoritas del localStorage.
    let favoriteSongs = JSON.parse(localStorage.getItem('favoriteSongs') || '[]');

    if (songItem.dataset.isFavorite === 'false') {
      // Si la canción no es favorita, la agrega a la lista de favoritos.
      songItem.dataset.isFavorite = 'true';
      fav.setAttribute('type', 'solid');
      favoriteSongs.push(song);
    } else {
      // Si la canción es favorita, la elimina de la lista de favoritos.
      songItem.dataset.isFavorite = 'false';
      fav.setAttribute('type', 'regular');
      favoriteSongs = favoriteSongs.filter(favSong => favSong.id !== song.id);
    }

    // Guarda la lista actualizada de favoritos en el localStorage.
    localStorage.setItem('favoriteSongs', JSON.stringify(favoriteSongs));

    // Actualiza la lista de canciones filtradas (función definida en otro lugar).
    updateFilteredSongList();
  });

  favSpan.appendChild(fav); // Agrega el icono de favorito al span.

  // Agrega los elementos creados al elemento de la canción.
  songItem.append(playIconDiv, titleSpan, artistSpan, durationSpan, favSpan);

  // Agrega un event listener al elemento de la canción para seleccionar la canción.
  songItem.addEventListener('click', () => selectSong(song));

  // Agrega un event listener al icono de reproducción para reproducir la canción.
  songItem.addEventListener('click', () => {
    selectSong(song);
    playSong(song);  // reproducir automáticamente al seleccionar la canción
  });

  playIconDiv.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  return songItem; // Devuelve el elemento de la canción creado.
}

function updateFilteredSongList() {
  // Obtener los enlaces para "Todas las canciones" y "Canciones favoritas"
  const allSongsLink = filterLinks[0];
  const favoriteSongsLink = filterLinks[1];

  // Si el enlace de "Canciones favoritas" está activo:
  if (favoriteSongsLink.classList.contains('active')) {
    // Obtener la lista de canciones favoritas desde el almacenamiento local
    const favoriteSongs = JSON.parse(localStorage.getItem('favoriteSongs') || '[]');
    // Obtener todos los elementos de canción en la página
    const allSongItems = scrollY.querySelectorAll('.song-item');
    // Iterar sobre cada elemento de canción
    allSongItems.forEach(songItem => {
      // Obtener los datos de la canción del atributo 'data-songData'
      const songData = JSON.parse(songItem.dataset.songData);
      // Verificar si la canción actual está en la lista de favoritas
      const isFavorite = favoriteSongs.some(favSong => favSong.id === songData.id);

      if (isFavorite) {
        // Mostrar la canción si es favorita
        songItem.style.display = '';
      } else {
        // Ocultar la canción si no es favorita
        songItem.style.display = 'none';
      }
    });
  } else {
    // Si el enlace de "Todas las canciones" está activo:
    // Mostrar todos los elementos de canción
    scrollY.querySelectorAll('.song-item').forEach(songItem => {
      songItem.style.display = '';
    });
  }
}

function selectSong(song) {
  // Quitar la clase 'selected' de la canción previamente seleccionada
  const previousSelected = document.querySelector('.song-item.selected');
  if (previousSelected) {
    previousSelected.classList.remove('selected');
  }

  // Encontrar el nuevo elemento y marcarlo como seleccionado
  const songItems = document.querySelectorAll('.song-item');
  songItems.forEach((item) => {
    const songData = JSON.parse(item.dataset.songData);
    if (songData.id === song.id) {
      item.classList.add('selected');
    }
  });

  // Actualizar los datos de la canción actual
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  currentSong = song;

  currentMusic.innerHTML = `
    <div class="song-info">
      <img id="coverInfo" src="${song.cover}" alt="${song.title}">
    </div>
  `;
  document.querySelector('.current-song .song-info').innerHTML = `
    <div class="song-name">${song.title}</div>
    <div class="artist-name">${song.artist}</div>
  `;
  isPlaying = false;
  updatePlayPauseButton(false);
}

function togglePlayPause() {
  // Si no hay una canción seleccionada, no hacer nada
  if (!currentSong) return;

  // Determinar si se debe reproducir o pausar la canción
  const willPlay = !currentAudio || currentAudio.paused;

  // Si no hay un elemento de audio o la ruta de la canción actual ha cambiado
  if (!currentAudio || currentAudio.src !== currentSong.filepath) {
    // Reproducir la canción
    playSong(currentSong);
  } else if (willPlay) {
    // Reanudar la reproducción
    currentAudio.play();
  } else {
    // Pausar la reproducción
    currentAudio.pause();
  }

  // Actualizar el estado de reproducción y el botón antes de actualizar el icono
  isPlaying = willPlay;
  updatePlayPauseButton(isPlaying);
}

function playSong(song) {
  console.log('Reproducciendo canción:', song);

  // Pausar la reproducción si hay un audio actual
  if (currentAudio) {
    currentAudio.pause();
  }

  // Seleccionar la canción visualmente
  selectSong(song);

  // Crear un nuevo objeto de audio con la ruta de la canción
  currentAudio = new Audio(song.filepath);

  // Agregar eventos antes de iniciar la reproducción
  currentAudio.addEventListener('loadedmetadata', () => {
    // Actualizar la duración total de la canción
    totalTime.textContent = formatTime(currentAudio.duration);

    // Iniciar la reproducción una vez cargados los metadatos
    currentAudio.play()
      .then(() => {
        isPlaying = true;
        updatePlayPauseButton(true);
      })
      .catch((error) => {
        console.error('Error reproduciendo la canción:', error);
        isPlaying = false;
        updatePlayPauseButton(false);
      });
  });

  // Manejar errores de reproducción
  currentAudio.addEventListener('error', (e) => {
    console.error('Audio error:', e);
    alert('Error reproduciendo la canción. Inténtalo de nuevo.');
    isPlaying = false;
    updatePlayPauseButton(false);
  });

  // Eventos existentes (manejo de fin de reproducción, actualización de tiempo y progreso)
  currentAudio.addEventListener('ended', handleSongEnd);

  currentAudio.addEventListener('timeupdate', () => {
    if (currentAudio && currentAudio.duration) {
      const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
      progressBar.value = progress;
      currentTime.textContent = formatTime(currentAudio.currentTime);
    }
  });

  // Aplicar el volumen actual
  currentAudio.volume = volume;
}

// Actualiza el icono del botón de reproducción/pausa y su texto
function updatePlayPauseButton(playing) {
  // Selecciona el elemento <box-icon> dentro del botón de reproducción
  const playButtonIcon = playButton.querySelector('box-icon');
  playButtonIcon.setAttribute('name', playing ? 'pause-circle' : 'play-circle');

  // Selecciona el elemento del botón de pausa superior
  const pauseTopButton = document.querySelector('.pause-button');

  if (pauseTopButton) {
    // Cambia el texto del botón
    pauseTopButton.textContent = playing ? 'PAUSE' : 'PLAY';
  }
}

// Formatea el tiempo en segundos a formato mm:ss
function formatTime(seconds) {
  // Calcula los minutos y segundos
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  // Devuelve una cadena con el formato mm:ss, asegurando que los segundos tengan dos dígitos
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Evento para la barra de progreso (al hacer clic y arrastrar)
progressBar.addEventListener('mousedown', (e) => {
  // Obtiene la posición de la barra de progreso
  const rect = progressBar.getBoundingClientRect();

  // Función para manejar el movimiento del ratón (arrastre)
  const handleMouseMove = (e) => {
    // Calcula el progreso en porcentaje basado en la posición del ratón
    const progress = (e.clientX - rect.left) / rect.width * 100;
    // Actualiza el valor visual de la barra de progreso
    progressBar.value = progress;
    // Actualiza el tiempo actual de reproducción
    updateCurrentTime(progress);
    // Actualiza el tiempo de reproducción del audio
    if (currentAudio && currentAudio.duration) { //verifica que currentAudio exista y que tenga una duración
      currentAudio.currentTime = progress / 100 * currentAudio.duration;
    }
  };

  // Añade el evento de movimiento del ratón a la ventana
  window.addEventListener('mousemove', handleMouseMove);
  // Añade un evento de soltar el ratón para eliminar el evento de movimiento
  window.addEventListener('mouseup', () => window.removeEventListener('mousemove', handleMouseMove));
});

// Actualiza el tiempo actual de reproducción en la interfaz de usuario
function updateCurrentTime(progress) {
  if (currentAudio && currentAudio.duration) { //verifica que currentAudio exista y que tenga una duración
    currentTime.textContent = formatTime(progress / 100 * currentAudio.duration);
  }
}

// Evento para la barra de volumen (al hacer clic y arrastrar)
volumeBar.addEventListener('mousedown', (e) => {
  // Obtiene las dimensiones y posición de la barra de volumen
  const rect = volumeBar.getBoundingClientRect();

  // Función para manejar el movimiento del ratón (arrastre)
  const handleMouseMove = (e) => {
    // Calcula el nuevo volumen basado en la posición del ratón
    let newVolume = (e.clientX - rect.left) / rect.width;
    // Limita el volumen entre 0 y 1
    newVolume = Math.max(0, Math.min(1, newVolume));
    // Actualiza el volumen
    updateVolume(newVolume);
  };

  // Añade el evento de movimiento del ratón a la ventana
  window.addEventListener('mousemove', handleMouseMove);
  // Añade un evento de soltar el ratón para eliminar el evento de movimiento
  window.addEventListener('mouseup', () => {
    window.removeEventListener('mousemove', handleMouseMove);
  });
});

// Actualiza el volumen y la barra de volumen
function updateVolume(value) {
  // Guarda el valor del volumen
  volume = value;
  // Actualiza la representación visual de la barra de volumen
  updateVolumeBar();
  // Si hay un audio reproduciéndose, actualiza su volumen
  if (currentAudio) {
    currentAudio.volume = volume;
  }
}

// Actualiza la apariencia de la barra de volumen y los iconos
function updateVolumeBar() {
  volumeBarFill.style.width = `${volume * 100}%`;

  let iconName;
  if (volume === 0) {
    iconName = 'volume-mute';
  } else if (volume < 0.5) {
    iconName = 'volume-low';
  } else {
    iconName = 'volume-full';
  }

  const volumeIcon = document.querySelector('.volume-controls box-icon');

  volumeIcon.setAttribute('name', iconName);
  volumeIcon.setAttribute('color', '#ffffff'); // Establecer el color a blanco
}

// Manejador de clic en la barra de volumen
volumeBar.addEventListener('click', (e) => {
  // Calcula el nuevo volumen basado en la posición del clic
  const newVolume = (e.clientX - volumeBar.getBoundingClientRect().left) / volumeBar.getBoundingClientRect().width;
  // Actualiza el volumen
  updateVolume(newVolume);
});

// Manejador de clic en los iconos de volumen
volumeIcons.forEach(icon => {
  icon.addEventListener('click', () => {
    switch (true) {
      case icon.classList.contains('bx-volume-full'):
        updateVolume(0);
        break;
      case icon.classList.contains('bx-volume-low'):
        updateVolume(0.25);
        break;
      default:
        updateVolume(1);
        break;
    }
  });
});

// Mostrar/ocultar el modal
btn.onclick = () => modal.style.display = "block";
cancelBtn.onclick = () => modal.style.display = "none";
window.onclick = (event) => {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

// Validación del título
const validateTitle = (title) => {
  const trimmedTitle = title.trim();

  if (trimmedTitle === '') {
    return 'El título no puede estar vacío';
  } else if (trimmedTitle.length > 20) {
    return 'El título no puede superar 20 caracteres';
  } else if (!/^[A-Za-z\s]+$/.test(trimmedTitle)) {
    return 'El título solo puede contener letras y espacios';
  } else {
    return '';
  }
};

// Validación del artista
const validateArtist = (artist) => {
  const trimmedArtist = artist.trim();

  if (trimmedArtist === '') {
    return 'El artista no puede estar vacío';
  } else if (trimmedArtist.length > 20) {
    return 'El artista no puede superar 20 caracteres';
  } else if (!/^[A-Za-z\s]+$/.test(trimmedArtist)) {
    return 'El artista solo puede contener letras y espacios';
  } else {
    return '';
  }
};

// Mostrar mensaje de error debajo del campo de entrada
function showError(inputElement, errorMessage) {
  // Eliminar cualquier mensaje de error existente
  const existingError = inputElement.nextElementSibling;
  if (existingError && existingError.classList.contains('error-message')) {
    existingError.remove();
  }
  // Crear un nuevo elemento para mostrar el mensaje de error
  const errorElement = document.createElement('div');
  errorElement.classList.add('error-message');
  errorElement.textContent = errorMessage;
  // Insertar el mensaje de error después del campo de entrada
  inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
}

// Limpiar todos los mensajes de error
function clearErrors() {
  document.querySelectorAll('.error-message').forEach(error => error.remove());
}

addMusicForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // Previene el envío predeterminado del formulario
  clearErrors(); // Limpia los mensajes de error existentes

  const titleValue = title.value.trim(); // Obtiene y limpia el valor del título
  const artistValue = artist.value.trim(); // Obtiene y limpia el valor del artista

  // Valida el título
  const titleError = validateTitle(titleValue);
  if (titleError) { // Si hay un error en el título
    showError(title, titleError); // Muestra el error en el campo del título
    return;
  }
  // Valida el artista
  const artistError = validateArtist(artistValue);
  if (artistError) { // Si hay un error en el artista
    showError(artist, artistError); // Muestra el error en el campo del artista
    return;
  }
  // Si no se ha seleccionado un archivo de música
  if (!musicFile.files.length) {
    showError(musicFile, 'Debe seleccionar un archivo de música'); // Muestra el error
    return;
  }
  // Si no se ha seleccionado una imagen de portada
  if (!coverImage.files.length) {
    showError(coverImage, 'Debe seleccionar una imagen de portada'); // Muestra el error
    return;
  }
  // Crea un nuevo objeto FormData
  const formData = new FormData();
  formData.append("music", musicFile.files[0]); // Añade el archivo de música al FormData
  formData.append("title", titleValue); // Añade el título al FormData
  formData.append("artist", artistValue); // Añade el artista al FormData
  formData.append("cover", coverImage.files[0]); // Añade la imagen de portada al FormData

  try {
    // Realiza la petición POST
    const response = await fetch("http://informatica.iesalbarregas.com:7007/upload", {
      method: "POST", // Método POST
      body: formData, // Datos del formulario
      headers: { "Accept": "application/json" }, // Acepta respuestas en formato JSON
    });

    if (response.ok) {
      const data = await response.json(); // Convierte la respuesta a JSON
      console.log("Canción subida con éxito:", data); // Muestra un mensaje en la consola
      alert("¡La canción se subió correctamente!"); // Muestra una alerta al usuario
      modal.style.display = "none"; // Oculta el modal
      addMusicForm.reset(); // Resetea el formulario
      fetchSongs(); // Actualiza la lista de canciones
    } else {
      const errorData = await response.json(); // Intenta obtener el mensaje de error del servidor
      console.error("Error al subir la canción:", errorData); // Muestra el error en la consola
      alert(`Error al subir la canción: ${response.status} - ${errorData.message || "Error desconocido"}`); // Muestra una alerta con el código de error y el mensaje
    }
  } catch (error) { // Maneja errores de la petición (ej. problemas de red)
    console.error("Error al enviar la solicitud:", error.message); // Muestra el error en la consola
    alert("Hubo un error al subir la canción. Inténtalo de nuevo."); // Muestra una alerta genérica de error
  }
});

// Evento 'input' para validación en tiempo real de título y artista
[title, artist].forEach(input => {
  input.addEventListener('input', () => { // Escucha el evento 'input' en cada campo
    const error = input === title ? validateTitle(title.value.trim()) : validateArtist(artist.value.trim()); // Valida el campo actual
    if (error) { // Si hay un error
      showError(input, error); // Muestra el error
    } else { // Si no hay error
      const existingError = input.nextElementSibling; // Obtiene el elemento hermano siguiente (el mensaje de error)
      if (existingError && existingError.classList.contains('error-message')) { // Si existe un mensaje de error
        existingError.remove(); // Elimina el mensaje de error
      }
    }
  });
});

// Función para procesar las canciones después de la petición (común a ambas llamadas)
function processSongs(songs) {
  allSongsList = songs;

  console.log('Songs received:', songs);
  console.log('Scrolly element in processSongs:', document.querySelector('.scrollY'));

  if (!scrollY) {
    console.error('Scrolly container not found in processSongs. Check your HTML structure.');
    return;
  }

  scrollY.innerHTML = '';

  songs.forEach(song => {
    const songItem = createSongItem(song);
    scrollY.appendChild(songItem);
  });
}

// Función para obtener la lista de canciones del servidor
function fetchSongs() {
  fetch(songsAPI, optionsGET)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(songs => {
      processSongs(songs); // Llama a la función común para procesar las canciones
      updateFilteredSongList();
    })
    .catch(error => {
      console.error("Error reloading songs:", error.message);
      if (scrollY) {
        scrollY.innerHTML = `<div style="color: red;">Error loading songs: ${error.message}</div>`;
      }
    });
}

// Recorre cada icono con la clase 'colorPrimary'
colorPrimaryIcons.forEach(icon => {
  // Encuentra el botón padre del icono
  const parentButton = icon.closest('.control-button');

  // Agrega un event listener al botón padre
  parentButton.addEventListener('click', () => {
    // Verifica si el botón padre tiene la clase 'active'
    if (parentButton.classList.contains('active')) {
      icon.setAttribute('color', '#ffffff'); // Cambia el color a blanco
    } else {
      icon.setAttribute('color', 'var(--color-primary)'); // Cambia el color a 'color-primary'
    }
  });
});
