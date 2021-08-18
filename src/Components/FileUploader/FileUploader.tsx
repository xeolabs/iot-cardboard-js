import { getTheme, Icon, ITheme, PrimaryButton } from '@fluentui/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import FilesList from './FilesList';
import './FileUploader.scss';

const FileUploader: React.FC = () => {
    const [files, setFiles] = useState<Array<File>>([]);
    const chooseFileButton = useRef(null);
    const filesRef = useRef(files);

    const theme: ITheme = getTheme();
    const { palette } = theme;

    const iconStyles = {
        root: {
            fontSize: 32,
            color: 'var(--cb-color-theme-primary)'
        }
    };

    useEffect(() => {
        filesRef.current = files;
    }, [files]);

    const handleOnChangeFiles = (event) => {
        event.stopPropagation();
        event.preventDefault();
        const newFiles = [...files];
        const selectedFiles = Array.from<File>(event.target.files);
        const existingFileNames = files.map((f) => f.name);
        selectedFiles.forEach((sF) => {
            if (!existingFileNames.includes(sF.name)) {
                newFiles.push(sF);
            }
        });
        setFiles(newFiles);
        event.target.value = null;
    };

    const removeFileHandler = useCallback((index: number) => {
        setFiles(filesRef.current.filter((_f, idx) => idx !== index));
    }, []);

    return (
        <div className={'cb-file-uploader'}>
            <div
                className={'cb-drop-files-container'}
                style={{ background: palette.neutralLighter }}
            >
                <Icon iconName="CloudUpload" styles={iconStyles} />
                <PrimaryButton
                    className={'cb-choose-file-button'}
                    text="Browse for files"
                    onClick={(_e) => chooseFileButton.current.click()}
                />
                <input
                    id="myInput"
                    type="file"
                    multiple
                    ref={(ref) => (chooseFileButton.current = ref)}
                    style={{ display: 'none' }}
                    onChange={handleOnChangeFiles}
                />
            </div>
            <FilesList
                files={files}
                onRemoveFile={removeFileHandler}
            ></FilesList>
        </div>
    );
};

export default FileUploader;
