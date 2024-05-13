import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CreateDeck.css';
import { setUserId } from '../../redux/actions';

function CreateDeck() {
    const [id, setId] = useState(null);
    const [decks, setDecks] = useState([]);
    const [myCards, setMyCards] = useState([]);
    const [activeDeck, setActiveDeck] = useState(null);
    const [deckName, setDeckName] = useState('');
    const [currentDeckName, setCurrentDeckName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);  // Zustand zum Überwachen, ob Änderungen gemacht wurden
    const [formData, setFormData] = useState({
        userID: id,
        name:"",
        cardNames:[""]
    });

    //Lädt die userID aus dem LocalStorage beim ersten Render der Komponente
    useEffect(() => {
        const loadedId = localStorage.getItem('id');
        if (loadedId) {
            setId(loadedId);
        }
        else {
            console.error('Keine userID im LocalStorage gefunden');
        }
    }, []);

    // Karten und Decks von der Datenbank abrufen
    useEffect(() => {

        // Abrufen der Karten des Spielers
        axios.get(`http://localhost:8080/cards`)
            .then(response => setMyCards(response.data))
            .catch(error => console.error('Fehler beim Abrufen der Karten:', error));

        // Abrufen der Decks
        axios.get(`http://localhost:8080/decks/getUserDecks/${localStorage.getItem('id')}`)
            .then(response => setDecks(response.data))
            .catch(error => console.error('Fehler beim Abrufen der Decks:', error));

    }, [id]);
    
    const loadDecks = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/decks/getUserDecks/${id}`);
            setDecks(response.data);
        } catch (error) {
            console.error('Fehler beim Abrufen der Decks:', error);
        }
    };

    const loadCards = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/cards`);
            setMyCards(response.data);
        } catch (error) {
            console.error('Fehler beim Abrufen der Karten:', error);
        }
    };


    /*
    const handleInputChange = (event) => {
        const { name, value} = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    */

    // Neues Deck hinzufügen
    const handleCreateNewDeck = async () => {
        if (decks.length >= 3) {
            setErrorMessage('Es können maximal drei Decks erstellt werden.');
            return;
        }
        if (isEditing) {
            setErrorMessage('Bitte speichern Sie die Änderungen am aktiven Deck, bevor Sie ein neues Deck erstellen.');
            return;
        }

        // Erstelle neues Deck-Objekt
        const newDeck = {
            userID: id, //
            name: `Deck ${decks.length + 1}`,
            cardNames: []
        };

        try {
            // Senden der Anfrage an das Backend
            const response = await axios.post(`http://localhost:8080/decks/create`, JSON.stringify(newDeck),{
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            loadDecks();
            loadCards();

            console.log('Deck erfolgreich erstellt', response.data);

        }
        catch (error) {
            console.error('Fehler beim Erstellen des Decks', error);
            if (error.response) {
                // Der Server antwortet mit einem Statuscode außerhalb des Bereichs 2xx
                console.error(error.response.data);
                console.error(error.response.status);
                console.error(error.response.headers);
                setErrorMessage('Fehler beim Erstellen des Decks: ' + (error.response?.data.message || error.message));
            }
            else if (error.request) {
                // Der Request wurde abgesetzt, aber es kam keine Antwort
                console.error(error.request);
                setErrorMessage('Keine Antwort vom Server beim Versuch, das Deck zu erstellen');
            }
            else {
                // Anderer Fehler beim Setup des Requests
                console.error('Error', error.message);
                setErrorMessage('Fehler beim Erstellen des Decks: ' + error.message);
            }
        }
    };
    

    // Karte zu einem aktiven Deck hinzufügen und an den Server senden
    const handleAddCardToDeck = async (card) => {
        if (activeDeck === null) {
            setErrorMessage('Kein aktives Deck ausgewählt.');
            return;
        }
    
        const deckToUpdate = decks[activeDeck];
        if (!deckToUpdate) {
            setErrorMessage('Aktives Deck konnte nicht identifiziert werden.');
            return;
        }
    
        // Formulardaten definieren zum Senden an Backend
        const dataToSend = {
            userID: id,
            name: deckToUpdate.name,
            cardNames: [card.name]
        };
    
        
        try {
            const response = await axios.put(`http://localhost:8080/decks/addCards`, JSON.stringify(dataToSend), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            loadDecks();
            loadCards();

            console.log("Karte erfolgreich hinzugefügt", response.data);

        }
        catch (error) {
            console.error('Fehler beim Hinzufügen der Karte', error);
            setErrorMessage('Fehler beim Hinzufügen der Karte: ' + (error.response?.data.message || error.message));
        }

    };
    
    // !!!! Muss noch optimiert werden für Fall, dass ausgewählt wird obwohl keine Veränderung vorgenommen wird
    // Wird aufgerufen, wenn ein Deck in der UI ausgewählt wird
    const selectDeck = (index) => {
        if (!isEditing) {
            setActiveDeck(index);
            setCurrentDeckName(decks[index].name);
            setDeckName(decks[index].name);
            setIsEditing(true);
        } else {
            setErrorMessage('Bitte speichern oder verwerfen Sie die Änderungen bevor Sie das Deck wechseln.');
        }
    };

    const updateDeckName = async () => {
        if (!deckName.trim()) {
            setErrorMessage('Der Deckname darf nicht leer sein');
            return;
        }
    
        try {
            // Senden der Anfrage zum Backend, um den Namen zu aktualisieren
            const response = await axios.put(`http://localhost:8080/decks/updateName/${id}/${currentDeckName}/${deckName}`);
            console.log('Deckname erfolgreich geändert!', response.data);


            loadDecks();
            loadCards();

            setActiveDeck(null);
            setIsEditing(false);
        } catch (error) {
            console.error('Fehler beim Ändern des Decknamens:', error);
            setErrorMessage('Fehler beim Ändern des Decknamens: ' + error.message);
        }
    };
    

    const handleDeleteDeck = async () => {

            const deckToDelete = decks[activeDeck];
            if (!deckToDelete) {
                setErrorMessage('Zu löschendes Deck konnte nicht identifiziert werden.');
                return;
            }

            const dataToSend = {
                [id]: deckToDelete.name,
            };
            
            // Festhalten der ID des aktiven Decks
            try {
                const response = await axios.delete(`http://localhost:8080/decks/delete`, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: dataToSend
                });
    
                setActiveDeck(null);
                setIsEditing(false);

                loadDecks();
                loadCards();
    
                console.log("Deck erfolgreich gelöscht", response.data);
    
            }
            catch (error) {
                console.error('Fehler beim Löschen des Decks', error);
                setErrorMessage('Fehler beim Löschen des Decks: ' + (error.response?.data.message || error.message));
            }
    };

    const handleRemoveCardFromDeck = async(cardName) => {
        
        const deckToUpdate = decks[activeDeck];
        if (!deckToUpdate) {
            setErrorMessage('Aktives  Deck konnte nicht identifiziert werden.');
            return;
        }

        const dataToSend = {
            userID: id,
            name: deckToUpdate.name,
            cardNames: [cardName]
        };


        try {
            const response = await axios.put(`http://localhost:8080/decks/removeCard`, JSON.stringify(dataToSend), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            loadDecks();
            loadCards();

            console.log("Karte erfolgreich entfernt", response.data);

        }
        catch (error) {
            console.error('Fehler beim Entfernen der Karte', error);
            setErrorMessage('Fehler beim Entfernen der Karte: ' + (error.response?.data.message || error.message));
        }

    }


    const clearErrorMessage = () => setErrorMessage('');

    return (
        <div className="container">
            <h1>Meine Decks</h1>
            {errorMessage && (
                <div className="error-message" onClick={clearErrorMessage}>
                    {errorMessage}
                </div>
            )}
            <button onClick={handleCreateNewDeck} disabled={isEditing}>Neues Deck erstellen</button>
            <div className="deck-list">
                {decks.map((deck, index) => (
                    <div key={index} className="card" onClick={() => selectDeck(index)}>
                        {deck.name}
                    </div>
                ))}
            </div>
            {activeDeck !== null && (
                <div className="cards-container">
                    <div className="cards-left">
                        <h2>Verfügbare Karten</h2>
                        {myCards.map(card => (
                            <div key={card.id} className="card" onClick={() => handleAddCardToDeck(card)}>
                                {card.name}
                            </div>
                        ))}
                    </div>
                    <div className="active-deck-container">
                        <h2>Aktives Deck: {decks[activeDeck].name}</h2>
                        <input type="text" value={deckName} onChange={(e) => setDeckName(e.target.value)} />
                        <div className="button-container">
                            <button onClick={updateDeckName} >Fertig</button>
                            <button onClick={handleDeleteDeck}>Deck Löschen</button>
                        </div>
                        <div className="card-container">
                            {decks[activeDeck].cards.map((card, index) => (
                                <div key={index} className="card" onClick={() => handleRemoveCardFromDeck(card.name)}>{card.name}</div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreateDeck;
