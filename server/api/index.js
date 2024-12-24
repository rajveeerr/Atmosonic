let express=require("express");
let app=express()

let axios=require("axios")

let env=require("dotenv")
env.config()

let cors=require("cors")

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.geminiAPI);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

function errorHandeler(err,req,res,next){
    res.status(500).json({
        message: "Something broke, most likely the spotify api"
    })
}

app.use(cors())
app.use(express.json())
app.use(errorHandeler)

app.post("/",async (req,res)=>{
    let city=req.body.city
    let weather=req.body.weather
    let token=await getToken();
    
    const prompt = `I am providing you weather condition and city name and trying to find a spotify song/playlist 
    perfect for these weather conditions and region. I am searching for songs using this endpoint 
    https://api.spotify.com/v1/search?q=genre:genre&type=track&limit=5, basically give me genre for these conditions, no other bs just one response with suitable genere. Focus on giving generes suitable to those regions like for punjab region any city of punjab lets say chandigarh it should be punjabi, for any haryanavi city it should be haryanavi etc etc.Return genre and market code(based on city and availaible for spotify) seperated by ',' . Weather Conditions: ${weather}  City: ${city}`;
    
    const result = await model.generateContent(prompt);
    console.log(result.response.text().split(","));
    
    let genre=result.response.text().split(",")[0].trim()
    let market=result.response.text().split(",")[1].trim()
    console.log(market);

    let playlistData=await spotifyPlaylist(genre,token,market)
    // console.log(playlistData);
    
    res.json({
        tracks: playlistData,
        genre
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

async function spotifyPlaylist(genre,token,market) {
    const accessToken = token;
    const offset=Math.floor(Math.random() * 3)
    console.log(offset);
    

    const response = await axios.get(`https://api.spotify.com/v1/search?q=genre:${genre}&type=track&limit=5&offset=${offset}&market=${market}`, {
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