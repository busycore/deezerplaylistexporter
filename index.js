const axios = require("axios")
const fs = require("fs")

async function getData(url){
    const req = await axios.get(url);
    return req;
}

function songsToObject(songs){
    const songList =[]
    for(song of songs){
        const songDuration = (song.duration)/60;
        const songItem = {
            title:song.title,
            artist:song.artist.name,
            album:song.album.title,
            duration:songDuration
        }
        songList.push(songItem);
    }  
    return songList;  
}

async function getSongsInAPlaylist(playlist_url){
    let page = 0
    let lastResult=[]
    const songList = []
    do {
        const req = await getData(playlist_url + `?index=${page}`)
        lastResult=req.data;
        const songs = req.data.data;
        const songsObject = songsToObject(songs)
        songList.push(...songsObject)
        page+=25;
    } while(lastResult.next)
    return songList;
}

async function getPlaylistsByUser(user_id){
    const req = await axios.get(`https://api.deezer.com/user/${user_id}/playlists`)
    const playlists = req.data.data;

    const userPlaylists=[]

    for(playlist of playlists){
            const playlistDuration = playlist.duration/60
            const tracks = await getSongsInAPlaylist(playlist.tracklist)
            const plist = {
                id:playlist.id,
                title:playlist.title,
                size:playlist.nb_tracks,
                duration:playlistDuration,
                tracks
            }
            userPlaylists.push(plist)
        }
    return userPlaylists;
}

function printPlaylist(playlists){
    for(playlist of playlists){
            console.log(`💿[${playlist.id}] - ${playlist.title} - ${playlist.size} tracks in ${playlist.duration.toFixed(2)} minutes`)
            for(track of playlist.tracks){
                console.log(`   🎵 -> ${track.artist} - ${track.title}(${track.album}) - ${track.duration.toFixed(2)}`)
            }     
    }
}

function csvExporter(playlists,file_outpath) {
    let header="playlist_name;song_title;artist_name;album_name;duration"
    let csvFile="";
    csv=csvFile+header;
    for (const playlist of playlists) {
        for (const track of playlist.tracks) {
            const line = `${playlist.title};${track.title};${track.artist};${track.album};${track.duration.toFixed(2)}\n`;
            csvFile=csvFile+line;
        }
    }
    const writeStream = fs.createWriteStream(file_outpath);
    writeStream.write(csvFile);
}

async function main(){
    const _arguments = process.argv.slice(2);
    const user_id=_arguments[0]
    let playlists;
    if(user_id===undefined){
        throw new Error("Please insert the user_id")
    }

    if(_arguments[1]==='-e'){
        switch (_arguments[2]) {
            case 'csv':
                const file_output=_arguments[3];
                if(file_output===undefined){
                    throw new Error("Please choose the output csv file");
                }
                playlists= await getPlaylistsByUser(user_id);
                console.log("CSV output");
                csvExporter(playlists,_arguments[3]);
                break;
            case 'pretty':
                playlists= await getPlaylistsByUser(user_id);
                console.log("Pretty Print output");
                printPlaylist(playlists);
                break;
            default:
                throw new Error("Please choose 'csv' or 'pretty' ")
                break;
        }
    }else{
        console.log("Pretty Print output");
        console.log(printPlaylist(playlists));
    }
}

main()


