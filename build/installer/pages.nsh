!ifndef PAGES_INCLUDED
!define PAGES_INCLUDED

!define MUI_PAGE_CUSTOMFUNCTION_SHOW customWelcome
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_PAGE_CUSTOMFUNCTION_SHOW customFinish
!insertmacro MUI_PAGE_FINISH

!define MUI_UNPAGE_CUSTOMFUNCTION_SHOW un.customConfirm
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!endif
