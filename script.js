let currentSong = new Audio();
let songs = [];
let currFolder = "";
let currentIndex = -1;  // Track current song index

// Convert seconds to MM:SS
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Fetch songs from songs.json in the selected folder
async function getSongs(folder) {
    currFolder = folder;
    let res = await fetch(`songs/${folder}/songs.json`);
    let data = await res.json();
    songs = data.songs;

    // Populate song list in sidebar
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML += `
        <li>
            <img src="img/music-player.png" alt="music-img" class="invert music-img">
            <div class="info">
                <div>${song.replaceAll("%20", " ")}</div>
            </div>
            <div class="playnow">
                <span>Play now</span>
                <img src="img/play.png" alt="play-icon" class="invert play-img"> 
            </div>
        </li>`;
    }

    // Attach play events to each song in list
    Array.from(document.querySelectorAll(".songList li")).forEach(e => {
        e.addEventListener("click", () => {
            playMusic(e.querySelector(".info div").innerText.trim());
        });
    });
}

// Play a specific track
const playMusic = (track, pause = false) => {
    currentSong.src = `songs/${currFolder}/` + track;
    currentIndex = songs.indexOf(track);  // Update currentIndex
    if (!pause) {
        currentSong.play();
        document.getElementById("play").src = "img/pause.png";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00";
}

// Fetch album folders and load their info.json
async function displayAlbums() {
    let res = await fetch("songs/albums.json");
    let albumsData = await res.json();

    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    for (const folder of albumsData.albums) {
        let infoRes = await fetch(`songs/${folder}/info.json`);
        let info = await infoRes.json();

        cardContainer.innerHTML += `
        <div class="card" data-folder="${folder}">
            <div class="play">
                <svg width="35" height="35" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50" fill="green" />
                    <polygon points="40,30 70,50 40,70" fill="black" />
                </svg>
            </div>
            <img src="songs/${folder}/${info.cover}" alt="Cover image">
            <h3>${info.title}</h3>
            <p>${info.description}</p>
        </div>`;
    }

    // Attach click events to album cards
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            await getSongs(card.dataset.folder);
            if (songs.length > 0) {
                playMusic(songs[0]);  // play first song when album card clicked
            }
        });
    });
}

// Main app logic
async function main() {
    let play = document.getElementById("play");
    let previous = document.getElementById("previous");
    let next = document.getElementById("next");

    // Display albums
    await displayAlbums();

    // Play/Pause button
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.png";
        } else {
            currentSong.pause();
            play.src = "img/play.png";
        }
    });

    // Progress bar update
    currentSong.addEventListener("timeupdate", () => {
        if (currentSong.duration) {
            document.querySelector(".songtime").innerHTML =
                `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
            document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });

    // Seekbar click
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width);
        currentSong.currentTime = currentSong.duration * percent;
    });

    // Hamburger open
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0%";
    });

    // Close sidebar
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
    });

    // Previous button
    previous.addEventListener("click", () => {
        if (currentIndex > 0) {
            playMusic(songs[currentIndex - 1]);
        }
    });

    // Next button
    next.addEventListener("click", () => {
        if (currentIndex + 1 < songs.length) {
            playMusic(songs[currentIndex + 1]);
        }
    });

    // Volume control
    document.querySelector(".range input").addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
    });

    // Mute toggle
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("img/medium-volume.png")) {
            e.target.src = e.target.src.replace("img/medium-volume.png", "img/mute.png");
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = e.target.src.replace("img/mute.png", "img/medium-volume.png");
            currentSong.volume = 0.1;
            document.querySelector(".range input").value = 10;
        }
    });
}

main();
