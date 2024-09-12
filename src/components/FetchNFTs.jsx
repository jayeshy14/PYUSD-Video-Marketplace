import React, { useEffect, useState } from 'react'
import Cards from './Cards'
import { toast } from 'react-toastify';
import { getProvider } from "../detectProvider";
import { provider, program } from "../anchorProvider";
import { web3 } from "@coral-xyz/anchor";
import { encode } from "@coral-xyz/anchor/dist/cjs/utils/bytes/bs58";
import axios from "axios";
import contractData from '../contracts/contractData.json'
import PlayerCard from './PlayerCard';


const anchor = require("@project-serum/anchor");

function FetchNFTs({ setNftitem }) {
  const [nftData, setNftData] = useState([]);
  const [nftsLoaded, setNftsLoaded] = useState(false)
  const [currNft, setCurrNft] = useState(null);
  const [player, setPlayer] = useState(false);

  useEffect(() => {
    const getNftDetails = async () => {
      try {
        const provider = getProvider();

        const nftOwnersResponse = await program.methods
          .getOwners()
          .accounts({
            state: new web3.PublicKey(contractData.STATE),
            signer: provider.publicKey,
          })
          .view();
        console.log(nftOwnersResponse);

        const nftStatesResponse = await program.methods
          .getNftStates()
          .accounts({
            state: new web3.PublicKey(contractData.STATE),
            signer: provider.publicKey,
          })
          .view();
        console.log(nftStatesResponse)



        const nftMetadataUriResponse = await program.methods
          .getMetadatauri()
          .accounts({
            state: new web3.PublicKey(contractData.STATE),
            signer: provider.publicKey,
          })
          .view();

        console.log("Metadata URI Response:", nftMetadataUriResponse);
        const formattedUris = nftMetadataUriResponse.map((uri) => (uri).toString());
        console.log("Formatted URIs:", formattedUris);

        const finalnfts = formattedUris.filter((uri) => uri.length !== 0);


        const nftDataPromises = formattedUris.map(async (uri) => {
          // const nftDataPromises = finalnfts.map(async (uri) => {
          try {
            const response = await axios.get(`https://${contractData.PINATA_URL}/ipfs/${uri}`);
            console.log("res.data: ", response.data);

            return response.data;
          } catch (error) {
            console.error(error)
          }
        })

        console.log(nftDataPromises)
        const fetchedNftData = await Promise.all(nftDataPromises);

        const data = nftMetadataUriResponse.map(
          (_uri, index) => ({
            data: fetchedNftData[index],
            owner: encode(nftOwnersResponse[index]),
            state: nftStatesResponse[index],
          })
        );
        console.log(data);

        setNftData(data);
        console.log(nftData)
        console.log(setNftsLoaded(true));

      } catch (error) {
        console.error("Error fetching NFT data:", error);
      }
    };

    getNftDetails();
  }, []);
  return (
    <>
      {nftsLoaded && player && (
        // <div className='flex flex-wrap gradient-bg-welcome   gap-10 justify-center pt-24 pb-5 px-16'>

        // </div>
        <div style={{
          width: '650px',
          height: 'auto',
          // backgroundColor: "#ddd",
          margin: '0 auto',
          display: 'block',
          // justifyContent:'center'
        }}>
          {/* <PlayerCard item={currNft} player={player}/> */}
          <div className='audio-outer'>
            <div className='audio-inner'>
              <PlayerCard item={currNft} player={player} setPlayer={setPlayer} setCurrNft={setCurrNft} currNft={currNft} />
            </div>
          </div>
        </div>
      )}
      {!nftsLoaded && (
        <h2 className='text-white font-bold pt-24 text-2xl text-center'>Loading...</h2>
      )}
      {nftsLoaded && (
        <div className='flex flex-wrap gradient-bg-welcome   gap-10 justify-center pt-24 pb-5 px-16'>
          {
            (nftData.length > 0 ?
              nftData.map((item, idx) => (
                <Cards item={item.data} setNftitem={setNftitem} index={idx} />
              ))
              : (
                <main style={{ padding: "1rem 0" }}>
                  <h2 className='text-white'>No listed assets</h2>
                </main>
              ))}
        </div>
      )}
    </>
  )
}

export default FetchNFTs;