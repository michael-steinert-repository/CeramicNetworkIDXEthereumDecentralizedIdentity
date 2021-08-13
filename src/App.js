import "./App.css";
import {useState} from "react";
import CeramicClient from "@ceramicnetwork/http-client";
import ThreeIdResolver from "@ceramicnetwork/3id-did-resolver"
import {EthereumAuthProvider, ThreeIdConnect} from "@3id/connect";
import {DID} from "dids";
import {IDX} from "@ceramicstudio/idx";

const node = "https://ceramic-clay.3boxlabs.com";

function App() {
    const [name, setName] = useState("");
    const [image, setImage] = useState("");
    const [loaded, setLoaded] = useState(false);

    async function connect() {
        const addresses = await window.ethereum.request({
            method: "eth_requestAccounts"
        });
        return addresses;
    }

    async function readProfile() {
        /* Getting the first Element of the Array */
        const [address] = await connect();
        /* Client that allows to interact with the Ceramic Network */
        const ceramic = new CeramicClient(node);
        const idx = new IDX({ceramic});

        try {
            /* Fetching Users Data */
            const data = await idx.get(
                /* Schema of User Data */
                "basicProfile",
                /* 	CAIP-2 Namespace of Ethereum Blockchain */
                `${address}@eip155:1`
            );
            console.log("Data: ", data);
            if (data.name) {
                setName(data.name);
            }
            if (data.avatar) {
                setImage(data.avatar);
            }
        } catch (error) {
            console.error("Error: ", error);
            setLoaded(true);
        }
    }

    async function updateProfile() {
        /* Getting the first Element of the Array */
        const [address] = await connect();
        const ceramic = new CeramicClient(node);
        const threeIdConnect = new ThreeIdConnect();
        const provider = new EthereumAuthProvider(window.ethereum, address);

        await threeIdConnect.connect(provider);

        /* Reference a Three Identity or create it */
        const did = new DID({
            provider: threeIdConnect.getDidProvider(),
            /* Resolver to Interact with the Ceramic API */
            resolver: {
                ...ThreeIdResolver.getResolver(ceramic)
            }
        });

        ceramic.setDID(did);
        /* Authenticate User */
        await ceramic.did.authenticate();

        /* Passing the authenticated Ceramic Client */
        const idx = new IDX({ceramic});

        await idx.set(
            /* Schema of User Data */
            "basicProfile",
            {
                name: name,
                avatar: image
            }
        );

        console.log("Profile updated");
    }

    return (
        <div className="App">
            <input placeholder="Name" onChange={(event) => setName(event.target.value)}/>
            <input placeholder="Profile Image" onChange={(event) => setImage(event.target.value)}/>
            <button onClick={updateProfile}>Set Profile</button>
            <button onClick={readProfile}>Read Profile</button>
            {
                name && (
                    <h3>{name}</h3>
                )
            }
            {
                image && (
                    <img style={{width: "400px"}} src={image}/>
                )
            }
            {
                (!image && !name && loaded) && (
                    <h4>No Profile exists</h4>
                )
            }
        </div>
    );
}

export default App;
