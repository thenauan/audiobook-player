; Guarda o idioma escolhido no instalador para o app abrir nesse idioma na primeira vez
!macro customInstall
  FileOpen $0 "$INSTDIR\resources\installer-language.txt" w
  FileWrite $0 "$LANGUAGE"
  FileClose $0
!macroend
