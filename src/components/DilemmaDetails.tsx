import React, {useEffect, useRef, useState} from 'react';
import {

    IonContent,
    IonTitle, IonFabButton, IonIcon, IonLabel, IonHeader, IonInput, IonToolbar,
} from '@ionic/react';
import {ArgumentItem, Dilemma, UserData} from "../constants/interfaces";
import ProgressBar from "./ProgressBar";
import ProList from "./ProList";
import ContraList from "./ContraList";
import Popup from "./NewArgumentPopup";
import {add, eyeOffOutline, returnDownBackOutline, eyeOutline, shareSocialOutline} from "ionicons/icons";
import "./css/global.css"
import store from "../storage/storage";
import * as htmlToImage from "html-to-image";
import {Directory, Filesystem} from "@capacitor/filesystem";
import {Share} from "@capacitor/share";


type Props = Dilemma & {
    onClose: () => void;
};

const DilemmaDetails: React.FC<Props> = ({pro, contra, id, lastEdit, name, progressbarBlur, onClose}) => {
    const [blurEffect, setBlurEffect] = useState<string>(progressbarBlur ? "blur(2px)" : "blur(0px)");
    const [greenPercentage, setGreenPercentage] = useState(50);
    const [redPercentage, setRedPercentage] = useState(50);
    const [dilemmaName, setDilemmaName] = useState(name);
    const [dilemma, setDilemma] = useState({
        proArguments: pro,
        conArguments: contra,
        ID: id,
        progressbarBlur: progressbarBlur
    });

    useEffect(() => {
        updatePercentages(pro, contra);
    }, []);

    useEffect(() => {
        const changeDilemmaName = async () => {
            const storedUser = await store.get('user') as UserData;
            if (storedUser) {
                const DilemmaIndex = storedUser.dilemmata.findIndex(d => d.id === id);
                const updatedUser = storedUser
                updatedUser.dilemmata[DilemmaIndex].name = dilemmaName;
                await store.set('user', updatedUser);
            }
        }
        changeDilemmaName()
    }, [dilemmaName]); // Funktion wird ausgeführt, wenn "value" sich ändert


    const updatePercentages = (pros: ArgumentItem[], cons: ArgumentItem[]) => {
        const totalProImportance = pros.reduce((sum, item) => sum + item.importance, 0)
        const totalContraImportance = cons.reduce((sum, item) => sum + item.importance, 0)
        const total = totalProImportance + totalContraImportance;


        setGreenPercentage(Math.round((totalProImportance / total) * 100));
        setRedPercentage(Math.round((totalContraImportance / total) * 100));


    };
    type PopupRefType = {
        openModal: () => void;
        closeModal: () => void;
    };

    const popupRef = useRef<PopupRefType | null>(null);

    const openPopup = () => {
        popupRef.current?.openModal();
    };

    const addNewProArgument = async (newItem: ArgumentItem) => {
        const storedUser = await store.get('user') as UserData;

        if (storedUser?.dilemmata?.find(dilemma => dilemma.id === id)) {
            // Hole das erste Dilemma
            const target = storedUser?.dilemmata?.find(dilemma => dilemma.id === id);
            if (target) {
                // Neues Argument hinzufügen
                target.pro.push(newItem);
                target.lastEdit = new Date().toLocaleDateString();

                // Aktualisiere nur das veränderte Dilemma in der Liste der Dilemmata

                const updatedDilemmata = [...storedUser.dilemmata];
                updatedDilemmata.forEach((dilemma, index) => {
                    if (dilemma.id === target.id) {
                        updatedDilemmata[index] = target
                    }

                });

                // Aktualisiere den `user`-Speicher
                const updatedUser = {...storedUser, dilemmata: updatedDilemmata};

                await store.set('user', updatedUser);

                // Aktualisiere das lokale `dilemma` und Prozentsätze
                updatePercentages(target.pro, target.contra);
                const oldDilemma = dilemma
                oldDilemma.proArguments = target.pro
                setDilemma(oldDilemma);
            }

        } else {
            console.error("Dilemma data is missing or undefined.");
        }
    };


    const addNewContraArgument = async (newItem: ArgumentItem) => {
        const storedUser = await store.get('user') as UserData;
        if (storedUser?.dilemmata?.find(dilemma => dilemma.id === id)) {
            // Hole das erste Dilemma
            const target = storedUser.dilemmata?.find(dilemma => dilemma.id === id);
            if (target) {
                // Neues Contra-Argument hinzufügen
                target.contra.push(newItem);
                target.lastEdit = new Date().toLocaleDateString();

                // Aktualisiere nur das veränderte Dilemma in der Liste der Dilemmata
                const updatedDilemmata = [...storedUser.dilemmata]
                updatedDilemmata.forEach((dilemma, index) => {
                    if (dilemma.id === target.id) {
                        updatedDilemmata[index] = target
                    }
                });

                // Aktualisiere den `user`-Speicher
                const updatedUser = {...storedUser, dilemmata: updatedDilemmata};
                await store.set('user', updatedUser);
                const oldDilemma = dilemma
                oldDilemma.conArguments = target.contra
                setDilemma(oldDilemma);

                // Aktualisiere das lokale `dilemma` und Prozentsätze
                updatePercentages(target.pro, target.contra);

            }

        } else {
            console.error("Dilemma data is missing or undefined.");
        }
    };

    const blurProgressbar = async () => {
        if (blurEffect === "blur(0px)") {
            setBlurEffect("blur(2px)")
            const dilemmacopy = dilemma
            dilemmacopy.progressbarBlur = true
            setDilemma(dilemmacopy)
        } else {
            setBlurEffect("blur(0px)")
            const dilemmacopy = dilemma
            dilemmacopy.progressbarBlur = false
            setDilemma(dilemmacopy)
        }
        const storedUser = await store.get('user') as UserData;

        if (storedUser?.dilemmata?.find(dilemma => dilemma.id === id)) {

            const updatedDilemmata = [...storedUser.dilemmata];
            const targetUser = updatedDilemmata.find(dilemma => dilemma.id === id)
            if (targetUser) {
                targetUser.progressbarBlur = !targetUser.progressbarBlur;
            }
            updatedDilemmata.forEach((dilemma) => {
                    if (dilemma.id === targetUser?.id) {
                        dilemma.progressbarBlur = targetUser.progressbarBlur;
                    }
                }
            )
            const updatedUser = {...storedUser, dilemmata: updatedDilemmata};
            await store.set('user', updatedUser);
        }
    }

    async function sharePngWithCapacitor(domId: string): Promise<void> {
        try {
            const element = document.getElementById(domId);
            if (!element) {
                console.error(`Element mit der ID "${domId}" nicht gefunden.`);
                return;
            }

            // Trash-Bins ausblenden
            const trashBins = document.querySelectorAll('.trashbin');
            trashBins.forEach((bin) => {
                (bin as HTMLElement).style.display = 'none';
            });
            const AddButton = document.querySelectorAll('.AddButton');
            AddButton.forEach((button) => {
                (button as HTMLElement).style.display = 'none';
            });
            const BackButton = document.querySelectorAll('.ion-no-border');
            BackButton.forEach((button) => {
                (button as HTMLElement).style.display = 'none';
            });
            const Eye = document.querySelectorAll('.eye');
            Eye.forEach((eye) => {
                (eye as HTMLElement).style.display = 'none';
            });

            // Generiere das Bild
            const canvas = await htmlToImage.toCanvas(element as HTMLElement);
            const context = canvas.getContext('2d');

            const qrImage = new Image();
            qrImage.src = 'assets/qrcode/qrcode.png';
            await new Promise((resolve) => (qrImage.onload = resolve));

            const size = 100;
            context?.drawImage(
                qrImage,
                canvas.width - size - 170,
                20,                      // Abstand von oben
                220,                    // Feste Breite
                220                     // Feste Höhe
            );


// Konvertiere das Canvas zu Base64-Daten
            const base64Data = canvas.toDataURL('image/png', 1.0);


            // Trash-Bins wieder anzeigen
            trashBins.forEach((bin) => {
                (bin as HTMLElement).style.display = '';
            });
            AddButton.forEach((button) => {
                (button as HTMLElement).style.display = '';
            });
            BackButton.forEach((button) => {
                (button as HTMLElement).style.display = '';
            });
            Eye.forEach((eye) => {
                (eye as HTMLElement).style.display = '';
            });

            // Speichern und Teilen (unverändert)
            const fileName = `shared-image-${Date.now()}.png`;
            const savedFile = await Filesystem.writeFile({
                path: fileName,
                data: base64Data.replace('data:image/png;base64,', ''),
                directory: Directory.Cache,
            });

            await Share.share({
                title: 'Share your Dilemma!',
                url: savedFile.uri,
            });

            console.log('Bild erfolgreich geteilt!');
        } catch (error) {
            console.error('Fehler beim Erstellen oder Teilen des Bildes:', error);
        }
    }


    return (
        <IonContent fullscreen className="safe-area" id={"content"}>
            <Popup ref={popupRef} style={{
                '--width': '100vw',
                '--height': '100vh',
                '--border-radius': '0',
            }}
                   addNewProArgument={addNewProArgument}
                   addNewContraArgument={addNewContraArgument}/>
            <IonToolbar style={{marginTop: "40px"}}>
                <IonHeader className="ion-no-border">
                    <div style={{display:"flex", justifyContent: 'space-between', marginRight:"15px"}}>
                    <IonLabel className="back-button" onClick={onClose}>
                        <IonIcon icon={returnDownBackOutline} className="back-icon"/>
                    </IonLabel>
                    <IonLabel onClick={async () => sharePngWithCapacitor("content")}>

                        <IonIcon size={"large"} icon={shareSocialOutline} >

                    </IonIcon>
                    </IonLabel>
                    </div>
                </IonHeader>
            </IonToolbar>

            <div >

                <div>
                    <div className="listen-container">

                        <IonTitle>
                            <IonInput
                                value={dilemmaName}
                                onIonInput={(e) => setDilemmaName(e.detail.value as string)}
                                style={{
                                    textOverflow: "ellipsis",
                                    overflow: "clip",
                                    whiteSpace: "nowrap",
                                    width: "100%" // Maximalbreite anpassen
                                }}
                            />

                        </IonTitle>


                        <div style={{marginRight: "10px", marginTop: "14px", fontSize: "18px"}}>
                            <IonLabel className="date-label"  style={{fontWeight: "bold",     maxWidth: "100%", // Begrenzung auf den Container
                            }}>{lastEdit}</IonLabel>
                        </div>

                    </div>
                    <div style={{textAlign: "center"}} className="eye">
                        <IonIcon onClick={() => blurProgressbar()}
                                 icon={dilemma.progressbarBlur ? eyeOffOutline : eyeOutline}
                        ></IonIcon>

                    </div>

                    <div style={{margin: "0px 10px 0px 10px", filter: blurEffect}} onClick={() => blurProgressbar()}>
                        <ProgressBar greenPercentage={dilemma.progressbarBlur ? 50 : greenPercentage}
                                     redPercentage={dilemma.progressbarBlur ? 50 : redPercentage}></ProgressBar>
                    </div>
                </div>


                <div className="listen-container">
                    <div className="prolist">
                        <ProList
                            items={dilemma.proArguments || []}
                            updatePercentages={updatePercentages}
                            dilemma={dilemma}
                        />
                    </div>
                    <div className="separator"></div>

                    <div className="contralist">

                        <ContraList
                            items={dilemma.conArguments || []}
                            updatePercentages={updatePercentages}
                            dilemma={dilemma}
                        /></div>
                </div>
            </div>

            <div className="open-argument-edit-button">
                <IonFabButton onClick={openPopup} className="AddButton">
                    <IonIcon icon={add}></IonIcon>
                </IonFabButton>
            </div>

        </IonContent>
    )
}
export default DilemmaDetails;
