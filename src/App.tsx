import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Checkbox from '@mui/material/Checkbox';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Label, ResponsiveContainer } from 'recharts';
import CustomTooltip from './graph-tooltip';
import Header from './header'
import './App.css';


const CHARACTER_PITY = 90; // number of pulls to guarentee a 5 star
const LIGHT_CONE_PITY = 80;
const CHARACTER_SOFT_PITY_THRESHOLD = 74; // how many pulls before hard pity does soft pity start
const LIGHT_CONE_SOFT_PITY_THRESHOLD = 66;
const CHARACTER_SOFT_PITY_SCALING = 0.06; // how much chance increases per pull in soft pity
const LIGHT_CONE_SOFT_PITY_SCALING = 0.07;
const CHARACTER_BASE_RATE = 0.006; // base odds of a 5 star
const LIGHT_CONE_BASE_RATE = 0.008;
const CHARACTER_RATE_UP_CHANCE = 0.5625; // given a 5 star is pulled, the chance for the rate up to drop
const LIGHT_CONE_RATE_UP_CHANCE = 0.78125;
const enum GATCHA_TYPE {
  CHARACTER = 1,
  LIGHT_CONE = 0
}


function App() {
  const [calcType, setCalcType] = useState("character");
  const [characterCount, setCharacterCount] = useState("");
  const [characterPity, setCharacterPity] = useState("");
  const [lightConeCount, setLightConeCount] = useState("");
  const [lightConePity, setLightConePity] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [data, setData] = useState([{roll: 0, percent: 0, cumulativeProb: 0}]);
  const [characterGuarentee, setCharacterGuarentee] = useState(false);
  const [lightConeGuarentee, setLightConeGuarentee] = useState(false);


  return (
    <div id="wrapper-div">
      <Header/>
      <div id="input-div">
        <FormControl>
          <FormLabel id="character-lightCone-buttons-group-label">What Are You Rolling For?</FormLabel>
          <RadioGroup
            row
            aria-labelledby="character-lightCone-buttons-group-label"
            defaultValue={true}
            name="character-lightCone-buttons-group"
            value={calcType}
            onChange={(event) => {setCalcType(event.target.value)}}
          >
            <FormControlLabel value={"character"} control={<Radio />} label="Character" />
            <FormControlLabel value={"lightCone"} control={<Radio />} label="Light Cone" />
            <FormControlLabel value={"both"} control={<Radio />} label="Both" />
          </RadioGroup>
        </FormControl>

        <div id="data-field-container">
          { (calcType == "character" || calcType == "both") &&
            <div className="data-field-div">
              <TextField
                id="character-count-field"
                label={"Rate Up Characters (1 - 7)"}
                value = {characterCount}
                variant="standard"
                margin="dense"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  if (event.target.value === "" ||
                    (event.target.value.length === 1 && event.target.value >= "1" && event.target.value <= "7")
                  ) {
                    setCharacterCount(event.target.value);
                  }
                }}
              />
              <TextField
                id="character-pity-field"
                label="Pity"
                value = {characterPity}
                variant="standard"
                margin="dense"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setCharacterPity(event.target.value);
                }}
              />
              <FormControlLabel control={
                <Checkbox 
                  defaultChecked
                  checked={characterGuarentee}
                  onChange={() => setCharacterGuarentee(!characterGuarentee)}
                />}
                label="Guarentee"
              />
            </div>
          }

          { (calcType == "lightCone" || calcType == "both") &&
            <div className="data-field-div">
              <TextField
                id="light-cone-count-field"
                label={"Rate Up Light Cones (1 - 5)"}
                value = {lightConeCount}
                variant="standard"
                margin="dense"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  if (event.target.value === "" ||
                    (event.target.value.length === 1 && event.target.value >= "1" && event.target.value <= "5")
                  ) {
                    setLightConeCount(event.target.value);
                  }
                }}
              />
              <TextField
                id="lc-pity-field"
                label="Pity"
                value = {lightConePity}
                variant="standard"
                margin="dense"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setLightConePity(event.target.value);
                }}
              />
              <FormControlLabel control={
                <Checkbox 
                  defaultChecked
                  checked={lightConeGuarentee}
                  onChange={() => setLightConeGuarentee(!lightConeGuarentee)}
                />}
                label="Guarentee"
              />
            </div>
          }
        </div>
        <Button
          id="calc-button"
          variant="contained"
          onClick={() => calcDists(calcType, Number(characterCount), Number(characterPity), characterGuarentee, Number(lightConeCount), Number(lightConePity), lightConeGuarentee)}
        >
          Calculate
        </Button>
      </div>
      
      { showResults &&
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            id="roll-graph"
            width={1000}
            height={400}
            data={data}

            margin={{
              top: 10,
              right: 90,
              left: 30,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="roll">
              <Label value="Rolls" offset={-3} position="bottom" />
            </XAxis>
            <YAxis yAxisId="left" >
              {/* <Label value="Chance" offset={-20} position="insideLeft" /> */}
            </YAxis>
            <YAxis yAxisId="right" orientation="right" width={1} >
              {/* <Label value="Cumulative Chance" offset={-120} position="insideRight" /> */}
            </YAxis>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="center" layout="horizontal" wrapperStyle={{top: 0, left: 62}} formatter={(value) => <span>{value == "cumulativeProb" ? "Cumulative Probability" : "Probability"}</span>}/>
            <Line yAxisId="right" type="monotone" dataKey="cumulativeProb" stroke="#ff7300" dot={false} />
            <Area yAxisId="left" type="monotone" dataKey="percent" stroke="#8884d8" fill="#8884d8" />
          </ComposedChart>
        </ResponsiveContainer>
      }
    </div>

  );

  // params:
  // type: "character" for just character, "lightcone" for just light cone, "both" for both
  // characterCount: how many characters are desired
  // characterPity: what is the starting pity on the character banner
  // characterGuarentee: is character guarenteed on next pull
  // lightConeCount: how many light cones are desired
  // lightConePity: what is the starting pity on the lightCone banner
  // lightConeGuarentee: is light cone guarenteed on next pull
  // returns:
  // list of chances of obtaining everything outlined, with value at index i being the chance
  function calcDists(type: string, characterCount: number, characterPity: number, characterGuarentee: boolean, lightConeCount: number, lightConePity: number, lightConeGuarentee: boolean ) {
    setData([]);

    let characterCalc = (type == "character" || type == "both");
    let lightConeCalc = (type == "lightCone" || type == "both");

    let result = [1.0];

    if (characterCalc) {
      // get odds of character with 0 for both guarenteed and non-guarenteed
      let guarenteedOdds = getDist(GATCHA_TYPE.CHARACTER, 0);
      let nonGuarenteedOdds = addDists(guarenteedOdds, guarenteedOdds, false, GATCHA_TYPE.CHARACTER);
    
      // get distribution for first 5 star from current state
      let characterDist = getDist(GATCHA_TYPE.CHARACTER, characterPity);

      // if not guarenteed append chance of losing rate up
      if (!characterGuarentee) {
        characterDist = addDists(characterDist, guarenteedOdds, false, GATCHA_TYPE.CHARACTER);
      }

      // add to distribution if more than 1 rate up 5 star is desired
      for (let obtained = 1; obtained < characterCount; obtained++) {
        characterDist = addDists(characterDist, nonGuarenteedOdds, true, GATCHA_TYPE.CHARACTER);
      }

      // add the distribution to the final result
      result = addDists(result, characterDist, true, GATCHA_TYPE.CHARACTER);
    }

    if (lightConeCalc) {
      // get odds of light cone with 0 for both guarenteed and non-guarenteed
      let guarenteedOdds = getDist(GATCHA_TYPE.LIGHT_CONE, 0);
      let nonGuarenteedOdds = addDists(guarenteedOdds, guarenteedOdds, false, GATCHA_TYPE.LIGHT_CONE);
    
      // get distribution for first 5 star from current state
      let lightConeDist = getDist(GATCHA_TYPE.LIGHT_CONE, lightConePity);

      // if not guarenteed append chance of losing rate up
      if (!lightConeGuarentee) {
        lightConeDist = addDists(lightConeDist, guarenteedOdds, false, GATCHA_TYPE.LIGHT_CONE);
      }

      // add to distribution if more than 1 rate up 5 star is desired
      for (let obtained = 1; obtained < lightConeCount; obtained++) {
        lightConeDist = addDists(lightConeDist, nonGuarenteedOdds, true, GATCHA_TYPE.LIGHT_CONE);
      }

      // add the distribution to the final result
      result = addDists(result, lightConeDist, true, GATCHA_TYPE.LIGHT_CONE);
    }
    
    let cumulativeProbVals: number[] = [];
    let cumulativeProbVal: number = 0;
    
    // calculate the cumulative probability values and append to data list which will be sent to graph library
    for (let i = 0; i < result.length; i++) {
      cumulativeProbVal = (result[i] * 100) + cumulativeProbVal;
      cumulativeProbVals[i] = cumulativeProbVal;
      setData((old) => [...old, {roll: i, percent: result[i] * 100, cumulativeProb: cumulativeProbVals[i]}]);
    }

    setShowResults(true);
  }
  
  // params:
  // firstRolls: first distribution to be added
  // secondRolls: second distribution to be added
  // guarenteeFail: if true, use the rateup chance to determine if we stop with first success or go on to second distribution to wait until second success
  //                if false, always require first distribution to proc followed by second
  // isCharacter: 1 for character, 0 for light cone
  // returns:
  // the resulting combined distribution
  function addDists(firstRolls: number[], secondRolls: number[], guarenteeFail: boolean, isCharacter: number) {
    let rateUpChance = guarenteeFail ? 0 : (isCharacter ? CHARACTER_RATE_UP_CHANCE : LIGHT_CONE_RATE_UP_CHANCE);
  
    let result: number[] = [];
  
    // some pseudo convolution thing
    for (let i1 = 0; i1 < firstRolls.length; i1++) {
      if (result.length <= i1) {
        result.push(0);
      }
      result[i1] += firstRolls[i1] * rateUpChance;

      let lostPityChance = (1 - rateUpChance) * firstRolls[i1];
      for (let i2 = 0; i2 < secondRolls.length; i2++) {
        if (result.length <= i1 + i2) {
          result.push(0);
        }
        result[i1 + i2] += lostPityChance * secondRolls[i2];
      }
    }
  
    return result;
  }
  
  // params:
  // isCharacter: 1 for character, 0 for light cone
  // pity: what is the starting pity
  // returns:
  // distribution of first 5 star for given type with a given starting pity
  function getDist(isCharacter: number, pity: number) {
    let cur: number[] = [];
    
    let hardPity = isCharacter ? CHARACTER_PITY : LIGHT_CONE_PITY;
    let baseRate = isCharacter ? CHARACTER_BASE_RATE : LIGHT_CONE_BASE_RATE;
    let softPityThreshold = isCharacter ? CHARACTER_SOFT_PITY_THRESHOLD : LIGHT_CONE_SOFT_PITY_THRESHOLD;
    let softPityScaling = isCharacter ? CHARACTER_SOFT_PITY_SCALING : LIGHT_CONE_SOFT_PITY_SCALING;
  
    let prevProb = 1;
  
    cur.push(0);

    // everythink is multiplied by prevprob since we are calcing the chance of hitting on that pull
    for (let pullCnt = pity + 1; pullCnt <= hardPity; pullCnt++) {
      if (pullCnt === hardPity) { // if hit hard pity 100% chance
        cur.push(prevProb);
      } else if (pullCnt < softPityThreshold) { // if before soft pity, jsut base rate
        cur.push(prevProb * baseRate);
        prevProb = prevProb * (1 - baseRate);
      } else {
        cur.push(prevProb * (baseRate + (pullCnt - softPityThreshold + 1) * softPityScaling)); // calc soft pity rate
        prevProb = prevProb * (1 - (baseRate + (pullCnt - softPityThreshold + 1) * softPityScaling));
      }
    }
  
    return cur;
  }
}

export default App;