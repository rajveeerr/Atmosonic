let express=require("express");
let app=express()

let axios=require("axios")

let env=require("dotenv")
env.config()

let cors=require("cors")

function errorHandeler(err,req,res,next){
    res.status(500).json({
        message: "Something broke, most likely the spotify apii"
    })
}

app.use(cors({origin: "https://atmosonic.netlify.app/main"}))
app.use(errorHandeler)

app.get("/",async (req,res)=>{//"?genre='chill'"
    let genre=req.query.genre
    let token=await getToken();
    
    let playlistData=await spotifyPlaylist(genre,token)
    console.log(playlistData);
    
    res.json({
        tracks: playlistData
    })
})

app.listen(process.env.port,()=>{
    console.log("Server is running at port: "+process.env.port);
})

async function getToken() {
    const clientId = process.env.clientId;
    const clientSecret = process.env.clientSecret;
    const encodedCredentials = btoa(`${clientId}:${clientSecret}`);
    
    const response = await axios.post('https://accounts.spotify.com/api/token', 
        {
            'grant_type': 'client_credentials'
        },
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${encodedCredentials}`
            }
        });

    if (response.statusText==="OK") {
        const data = response.data;
        return data.access_token;
    } else {

        console.log('There was an error try again later.');
    }
}

async function spotifyPlaylist(genre,token) {
    const accessToken = token;

    const response = await axios.get(`https://api.spotify.com/v1/search?q=genre:${genre}&type=track&limit=5`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    if (response.statusText==="OK") {
        const data = await response.data;
        return data;
    } 
    return null; 
}