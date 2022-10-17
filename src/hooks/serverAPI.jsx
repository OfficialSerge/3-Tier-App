import axios from "axios";

let URL = 'https://us-central1-three-tier-app-7045b.cloudfunctions.net/default'

if (window.location.hostname === "localhost") {
  URL = 'http://localhost:5001/three-tier-app-7045b/us-central1/default'
}

export default axios.create({
  baseURL: URL,
  method: 'GET'
})