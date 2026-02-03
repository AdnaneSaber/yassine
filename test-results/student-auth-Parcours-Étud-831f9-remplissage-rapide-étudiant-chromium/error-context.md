# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]: Système de Gestion des Demandes
      - generic [ref=e6]: Connectez-vous pour accéder à votre espace
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - generic [ref=e10]: Email
          - textbox "Email" [ref=e11]:
            - /placeholder: votre.email@university.edu
            - text: adnane.saber@university.edu
        - generic [ref=e12]:
          - generic [ref=e13]: Mot de passe
          - textbox "Mot de passe" [ref=e14]:
            - /placeholder: ••••••••
            - text: any
        - button "Se connecter" [ref=e15]
        - generic [ref=e20]: Comptes de test
        - generic [ref=e21]:
          - button "Admin" [ref=e22]
          - button "Étudiant" [ref=e23]
      - generic [ref=e24]:
        - paragraph [ref=e25]: "Comptes de test :"
        - list [ref=e26]:
          - listitem [ref=e27]: "👨‍💼 Admin: admin@university.edu / Admin123!"
          - listitem [ref=e28]: "👨‍🎓 Étudiant: adnane.saber@university.edu / any"
  - region "Notifications alt+T"
  - status [ref=e29]:
    - generic [ref=e30]:
      - img [ref=e32]
      - generic [ref=e34]:
        - text: Static route
        - button "Hide static indicator" [ref=e35] [cursor=pointer]:
          - img [ref=e36]
  - alert [ref=e39]
```