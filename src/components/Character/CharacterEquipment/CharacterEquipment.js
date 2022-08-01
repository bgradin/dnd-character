import React from 'react';
import { register } from "../../../data";

import './CharacterEquipment.scss';

export default function CharacterEquipment() {
    return (
        <div className="character-equipment">
            <div className="character-equipment-wrap">
                <div className="character-equipment__stats">
                    <div className="character-equipment__stats-item">
                        <span className="character-equipment__stats-item-text">CP</span>
                        <input
                            name="cp"
                            type="text"
                            className="character-equipment__stats-item-input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <div className="character-equipment__stats-item">
                        <span className="character-equipment__stats-item-text">SP</span>
                        <input
                            name="sp"
                            type="text"
                            className="character-equipment__stats-item-input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <div className="character-equipment__stats-item">
                        <span className="character-equipment__stats-item-text">EP</span>
                        <input
                            name="ep"
                            type="text"
                            className="character-equipment__stats-item-input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <div className="character-equipment__stats-item">
                        <span className="character-equipment__stats-item-text">GP</span>
                        <input
                            name="gp"
                            type="text"
                            className="character-equipment__stats-item-input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <div className="character-equipment__stats-item">
                        <span className="character-equipment__stats-item-text">PP</span>
                        <input
                            name="pp"
                            type="text"
                            className="character-equipment__stats-item-input"
                            ref={(input) => register(input)}
                        />
                    </div>
                </div>
                <div className="character-equipment__textarea">
                    <textarea
                        name="equipment"
                        id=""
                        cols="30"
                        rows="19"
                        ref={(input) => register(input)}
                    ></textarea>
                </div>
            </div>
            <span className="character-attack-spellcasting__text">Equipment</span>
        </div>
    )
}
