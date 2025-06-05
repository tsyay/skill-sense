import React from "react";
import '../styles/mainPage.css';
import Hero from '../components/hero';
import Features from '../components/features';
import Demonstration from "../components/demonstration";
import HHru from "../components/hhru";
const MainPage = () => {

    return (
        <div>
            <Hero />
            <Features />
            <Demonstration />
            <HHru />
        </div>
    )
}

export default MainPage;