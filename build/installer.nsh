; Nome do atalho do desinstalador no Menu Iniciar, no idioma escolhido no instalador
!macro uninstallShortcutName VAR
  StrCpy ${VAR} "Desinstalar Audiobook Player"
  StrCmp $LANGUAGE "1033" 0 +2
    StrCpy ${VAR} "Uninstall Audiobook Player"
  StrCmp $LANGUAGE "1049" 0 +2
    StrCpy ${VAR} "Удалить Audiobook Player"
  StrCmp $LANGUAGE "1025" 0 +2
    StrCpy ${VAR} "إلغاء تثبيت Audiobook Player"
!macroend

!macro customInstall
  ; Guarda o idioma escolhido no instalador para o app abrir nesse idioma na primeira vez
  FileOpen $0 "$INSTDIR\resources\installer-language.txt" w
  FileWrite $0 "$LANGUAGE"
  FileClose $0

  ; Atalho do desinstalador no Menu Iniciar (o desinstalador fica na pasta do programa)
  !insertmacro uninstallShortcutName $1
  CreateShortCut "$SMPROGRAMS\$1.lnk" "$INSTDIR\${UNINSTALL_FILENAME}" "" "$INSTDIR\${UNINSTALL_FILENAME}" 0
!macroend

!macro customUnInstall
  ; Apaga o atalho do desinstalador (em qualquer um dos idiomas do instalador)
  Delete "$SMPROGRAMS\Desinstalar Audiobook Player.lnk"
  Delete "$SMPROGRAMS\Uninstall Audiobook Player.lnk"
  Delete "$SMPROGRAMS\Удалить Audiobook Player.lnk"
  Delete "$SMPROGRAMS\إلغاء تثبيت Audiobook Player.lnk"
!macroend
