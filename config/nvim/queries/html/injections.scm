; extends

; For Eta's [%= %], [% %], etc. tags
((text) @javascript
  (#match? @javascript "^[%][-=~]?")
  (#set! "injection.language" "javascript"))
